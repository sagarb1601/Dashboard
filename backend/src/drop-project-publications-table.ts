import pool from './db';

async function dropProjectPublicationsTable() {
  try {
    console.log('Dropping project_publications table...');
    
    // Drop the table with CASCADE to remove all dependencies
    await pool.query('DROP TABLE IF EXISTS project_publications CASCADE');
    
    console.log('✅ project_publications table dropped successfully');
    
    // Close the pool
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error dropping project_publications table:', error);
    process.exit(1);
  }
}

dropProjectPublicationsTable(); 