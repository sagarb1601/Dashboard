import dotenv from 'dotenv';
import { pool, initializeDatabase } from './db/setup';
import app from './app';

dotenv.config();

const port = process.env.PORT || 5000;

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('Successfully connected to database');
    client.release();

    // Initialize database (run migrations)
    await initializeDatabase();

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server...');
  await pool.end();
  process.exit(0);
});

startServer(); 