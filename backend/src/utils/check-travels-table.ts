import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function checkTravelsTable() {
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'travels'
      );
    `);
    
    console.log('Travels table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Get table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'travels'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      columns.rows.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Get number of records
      const count = await pool.query('SELECT COUNT(*) FROM travels');
      console.log('\nNumber of records:', count.rows[0].count);
    }
  } catch (error) {
    console.error('Error checking travels table:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkTravelsTable(); 