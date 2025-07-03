import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function checkHRTables() {
  try {
    console.log('Checking HR tables...');
    
    // Check if hr_employees table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hr_employees'
      );
    `);
    
    console.log('hr_employees table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Check table structure
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees'
        ORDER BY ordinal_position;
      `);
      
      console.log('hr_employees columns:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there are any employees
      const employeeCount = await pool.query('SELECT COUNT(*) FROM hr_employees');
      console.log('Total employees:', employeeCount.rows[0].count);
      
      // Check employees without group
      const withoutGroup = await pool.query(`
        SELECT COUNT(*) 
        FROM hr_employees 
        WHERE technical_group_id IS NULL AND status = 'active'
      `);
      console.log('Employees without group:', withoutGroup.rows[0].count);
    }
    
    // Check if technical_groups table exists
    const groupsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'technical_groups'
      );
    `);
    
    console.log('technical_groups table exists:', groupsTableExists.rows[0].exists);
    
    if (groupsTableExists.rows[0].exists) {
      const groups = await pool.query('SELECT * FROM technical_groups');
      console.log('Technical groups:', groups.rows);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkHRTables(); 