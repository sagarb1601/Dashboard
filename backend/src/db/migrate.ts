import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool();

async function runMigration() {
  try {
    console.log('Starting migration process...');
    console.log('Database config:', {
      host: process.env.PGHOST,
      port: process.env.PGPORT,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER
    });

    // First ensure the migration_history table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT migration_name FROM migration_history'
    );
    const executedMigrationNames = new Set(
      executedMigrations.map(row => row.migration_name)
    );

    // Read migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const numA = parseInt(a.split('_')[0]);
        const numB = parseInt(b.split('_')[0]);
        return numA - numB;
      });
    
    for (const migrationFile of migrationFiles) {
      if (executedMigrationNames.has(migrationFile)) {
        console.log(`Skipping already executed migration: ${migrationFile}`);
        continue;
      }

      try {
        const migrationPath = path.join(migrationsDir, migrationFile);
        let migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // Remove comments and empty lines
        migrationSql = migrationSql
          .split('\n')
          .filter(line => !line.trim().startsWith('--') && line.trim())
          .join('\n');

        await pool.query('BEGIN');
        
        try {
          // Execute the entire migration as one transaction
          await pool.query(migrationSql);
          await pool.query(
            'INSERT INTO migration_history (migration_name) VALUES ($1)',
            [migrationFile]
          );
          await pool.query('COMMIT');
          console.log(`Successfully executed migration: ${migrationFile}`);
        } catch (err) {
          const error = err as Error;
          // If table already exists, mark migration as complete and continue
          if (error.message.includes('already exists')) {
            console.log(`Some tables already exist, marking migration as complete`);
            await pool.query(
              'INSERT INTO migration_history (migration_name) VALUES ($1)',
              [migrationFile]
            );
            await pool.query('COMMIT');
            continue;
          }
          throw err;
        }
      } catch (err) {
        await pool.query('ROLLBACK');
        const error = err as Error;
        console.error(`Migration failed: ${error}`);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } catch (err) {
    const error = err as Error;
    console.error('Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration(); 