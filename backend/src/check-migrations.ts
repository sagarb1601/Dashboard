import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function checkMigrations() {
  try {
    console.log('Checking migrations and database state...');
    
    // Check migration history
    const migrations = await pool.query('SELECT * FROM migration_history ORDER BY executed_at');
    console.log('\nExecuted migrations:');
    migrations.rows.forEach(migration => {
      console.log(`  ${migration.migration_name} - ${migration.executed_at}`);
    });
    
    // Check if hr_employees table exists and its structure
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hr_employees'
      );
    `);
    
    console.log('\nhr_employees table exists:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'hr_employees'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nhr_employees columns:');
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check if there are any employees
      const employeeCount = await pool.query('SELECT COUNT(*) FROM hr_employees');
      console.log('\nTotal employees:', employeeCount.rows[0].count);
    }
    
    // Check technical_groups table
    const groupsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'technical_groups'
      );
    `);
    
    console.log('\ntechnical_groups table exists:', groupsTableExists.rows[0].exists);
    
    if (groupsTableExists.rows[0].exists) {
      const groups = await pool.query('SELECT * FROM technical_groups');
      console.log('\nTechnical groups:');
      groups.rows.forEach(group => {
        console.log(`  ${group.group_id}: ${group.group_name} - ${group.group_description}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking migrations:', error);
  } finally {
    await pool.end();
  }
}

checkMigrations(); 