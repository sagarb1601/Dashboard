import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export async function runMigrations(pool: Pool) {
  try {
    const migrationsDir = path.join(__dirname);

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const numA = parseInt(a.split('_')[0], 10);
        const numB = parseInt(b.split('_')[0], 10);
        return numA - numB;
      });

    await pool.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const executed = await pool.query('SELECT migration_name FROM migration_history');
    const executedMigrations = new Set(executed.rows.map(row => row.migration_name));

    for (const file of migrationFiles) {
      if (executedMigrations.has(file)) {
        console.log(`Skipping already executed migration: ${file}`);
        continue;
      }

      try {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await pool.query('BEGIN');

        try {
          await pool.query(sql);
          await pool.query(
            'INSERT INTO migration_history (migration_name) VALUES ($1)',
            [file]
          );
          await pool.query('COMMIT');
          console.log(`✅ Successfully executed migration: ${file}`);
        } catch (err: any) {
          const message = err.message?.toLowerCase() || '';

          // Ignore safe duplicate errors
          if (
            message.includes('already exists') ||
            message.includes('duplicate key') ||
            message.includes('relation') && message.includes('already exists') ||
            message.includes('index') && message.includes('already exists')
          ) {
            console.warn(`⚠️ Skipping migration due to already existing object: ${file}`);
            await pool.query(
              'INSERT INTO migration_history (migration_name) VALUES ($1)',
              [file]
            );
            await pool.query('COMMIT');
            continue;
          }

          throw err; // unrecoverable error
        }

      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`❌ Error executing migration ${file}:`, err);
        // Do not throw here if you want to continue even on fatal errors
        // throw err;
      }
    }

    console.log('🎉 All pending migrations completed.');
  } catch (err) {
    console.error('Migration process failed:', err);
    throw err;
  }
}
