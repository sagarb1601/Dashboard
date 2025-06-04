import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { runMigrations } from './migrations';

// Create a single pool instance that will be shared across the application
export const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

// Initialize database and run migrations
export async function initializeDatabase() {
  try {
    // Test database connection
    console.log('Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    // Enable required extensions
    console.log('Enabling required extensions...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    console.log('pgcrypto extension enabled');

    // Create migration history table if it doesn't exist
    console.log('Creating migration history table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Migration history table ready');

    // Run migrations using the imported function
    console.log('Running migrations...');
    await runMigrations(pool);
    console.log('All migrations completed');

    // Verify users table and default users
    const usersCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE username IN ('admin', 'finance')
    `);

    if (usersCheck.rows[0].count < 2) {
      console.log('Recreating default users...');
      await pool.query(`
        INSERT INTO users (username, password_hash, role)
        VALUES 
          ('admin', crypt('admin123', gen_salt('bf', 10)), 'admin'),
          ('finance', crypt('finance123', gen_salt('bf', 10)), 'finance')
        ON CONFLICT (username) 
        DO UPDATE SET 
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role
      `);
      console.log('Default users created/updated');
    } else {
      console.log('Default users already exist');
    }

    console.log('Successfully initialized database');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export a function to gracefully close the pool when needed (e.g., during shutdown)
export async function closePool() {
  await pool.end();
} 