import pool from './db';

async function dropProjectEventsTable() {
  try {
    console.log('Dropping project_events table...');
    
    // Drop the table with CASCADE to remove all dependencies
    await pool.query('DROP TABLE IF EXISTS project_events CASCADE');
    
    console.log('✅ project_events table dropped successfully');
    
    // Close the pool
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error dropping project_events table:', error);
    process.exit(1);
  }
}

dropProjectEventsTable(); 