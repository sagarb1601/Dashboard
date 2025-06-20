import pool from './db';
import fs from 'fs';
import path from 'path';

async function createProjectPublicationsTable() {
  try {
    console.log('Creating project_publications table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'db', 'migrations', '062_create_project_publications_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ project_publications table created successfully');
    
    // Close the pool
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error creating project_publications table:', error);
    process.exit(1);
  }
}

createProjectPublicationsTable(); 