import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { authenticateToken } from './middleware/auth';
import financeRoutes from './routes/finance';
import { pool, initializeDatabase } from './db/setup';
import app from './app';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
}

dotenv.config();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    // Get current user's password hash
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }

    // Hash new password and update
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add finance routes
app.use('/api/finance', financeRoutes);

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