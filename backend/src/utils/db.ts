import pool from '../db';

export async function checkTableExists(tableName: string) {
    const result = await pool.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = $1
        );
    `, [tableName]);
    return result.rows[0];
} 