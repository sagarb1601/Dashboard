import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a new Pool instance with connection details
export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dashboard',
  password: 'sagar123',
  port: 5432,
});

// Test the database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('New client connected to database');
    client.release();
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}; 