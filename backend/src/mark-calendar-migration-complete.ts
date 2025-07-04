import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function markMigrationComplete() {
    const client = await pool.connect();
    try {
        // Check if migration is already marked as complete
        const checkResult = await client.query(
            'SELECT * FROM migration_history WHERE migration_name = $1',
            ['055_add_ed_attendance_to_calendar_events.sql']
        );

        if (checkResult.rows.length > 0) {
            console.log('Migration already marked as complete');
            return;
        }

        // Mark migration as complete
        await client.query(
            'INSERT INTO migration_history (migration_name, executed_at) VALUES ($1, NOW())',
            ['055_add_ed_attendance_to_calendar_events.sql']
        );

        console.log('Successfully marked calendar events migration as complete');
    } catch (error) {
        console.error('Error marking migration as complete:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

markMigrationComplete().catch(console.error); 