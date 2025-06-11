import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from './db';
import { authenticateToken } from './middleware/auth';
import financeRoutes from './routes/finance';
import expenditureRoutes from './routes/expenditure';
import contractorRoutes from './routes/admin/contractors';
import staffRoutes from './routes/admin/staff';
import departmentsRoutes from './routes/admin/departments';
import amcRoutes from './routes/amc';
import authRoutes from './routes/auth';

import actsRoutes from './routes/acts';
import hrRoutes from './routes/hr';


const app = express();

app.use(express.json());

// CORS configuration
app.use(cors({
  origin: true,  // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Increase preflight cache time to 10 minutes
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log('\n=== INCOMING REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('========================\n');
  next();
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/expenditure', authenticateToken, expenditureRoutes);
app.use('/api/admin', contractorRoutes);
app.use('/api/admin', staffRoutes);
app.use('/api/admin', departmentsRoutes);
app.use('/api/amc', authenticateToken, amcRoutes);

app.use('/api/acts', authenticateToken, actsRoutes);
app.use('/api/hr', authenticateToken, hrRoutes);


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

export default app; 