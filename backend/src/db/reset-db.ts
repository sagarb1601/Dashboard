import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// First connect to postgres database to create our database if it doesn't exist
const initPool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: 'postgres',
  port: parseInt(process.env.PGPORT || '5432'),
});

const dbName = process.env.PGDATABASE || 'dashboard';

async function createDatabaseIfNotExists() {
  try {
    const result = await initPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (result.rows.length === 0) {
      await initPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    }
  } catch (error) {
    console.error('Error creating database:', error);
    throw error;
  } finally {
    await initPool.end();
  }
}

// Pool for our actual database operations
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: dbName,
  port: parseInt(process.env.PGPORT || '5432'),
});

async function resetDatabase() {
  try {
    await createDatabaseIfNotExists();
    
    // Drop all tables in correct order
    await pool.query(`
      DROP TABLE IF EXISTS project_expenditure_entries CASCADE;
      DROP TABLE IF EXISTS project_budget_entries CASCADE;
      DROP TABLE IF EXISTS project_budget_fields_mapping CASCADE;
      DROP TABLE IF EXISTS budget_fields CASCADE;
      DROP TABLE IF EXISTS finance_projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('All tables dropped successfully');

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir);

    for (const file of migrationFiles) {
      if (file.endsWith('.sql')) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(sql);
        console.log(`Executed migration: ${file}`);
      }
    }

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase(); 