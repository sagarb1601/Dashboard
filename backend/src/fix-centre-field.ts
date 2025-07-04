import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function fixCentreField() {
  try {
    console.log('Fixing centre field length in hr_employees table...');
    
    const result = await pool.query(`
      ALTER TABLE hr_employees ALTER COLUMN centre TYPE character varying(10);
    `);
    
    console.log('Centre field length updated successfully!');
    
    // Verify the change
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'hr_employees' AND column_name = 'centre';
    `);
    
    console.log('Verification result:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('Error fixing centre field:', error);
  } finally {
    await pool.end();
  }
}

fixCentreField(); 