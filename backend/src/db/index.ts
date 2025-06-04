import { Pool } from 'pg';

// Create a single pool instance that will be shared across the application
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'sagar123',
    database: process.env.PGDATABASE || 'dashboard',
    port: parseInt(process.env.PGPORT || '5432'),
});

// Add event listeners for connection issues
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('New client connected to database');
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error testing database connection:', err);
    } else {
        console.log('Database connection test successful');
    }
});

export default pool; 