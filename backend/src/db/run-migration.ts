import { Pool } from 'pg';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  user: 'postgres',
  password: 'sagar123',
  host: 'localhost',
  port: 5432,
  database: 'dashboard'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '011_add_status_to_amc_contracts.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Run the migration
    await client.query(migrationSQL);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error); 