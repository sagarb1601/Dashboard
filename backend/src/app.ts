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
import dashboardRoutes from './routes/admin/dashboard';
import vehiclesRoutes from './routes/admin/vehicles';
import amcRoutes from './routes/amc';
import authRoutes from './routes/auth';
import technicalPatentsRoutes from './routes/technical/patents';
import technicalProposalsRoutes from './routes/technical/proposals';
import testRoutes from './routes/technical/test';
import businessRoutes from './routes/business';
import financeDashboardRoutes from './routes/finance-dashboard';
import edofficeDashboardRoutes from './routes/edoffice/dashboard';

import actsRoutes from './routes/acts';
import hrRoutes from './routes/hr';
import technicalGroupsRoutes from './routes/technical-groups';
import travelsRouter from './routes/travels';
import mmgRouter from './routes/mmg';
import actsDashboardRoutes from './routes/acts-dashboard';
import hrDashboardRoutes from './routes/hr-dashboard';
import mmgDashboardRouter from './routes/mmg-dashboard';

console.log('App: MMG router imported successfully');

const app = express();

app.use(express.json());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend URL
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
app.use('/api/technical/patents', authenticateToken, technicalPatentsRoutes);
app.use('/api/technical/proposals', authenticateToken, technicalProposalsRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/expenditure', authenticateToken, expenditureRoutes);
app.use('/api/finance-dashboard', authenticateToken, financeDashboardRoutes);
app.use('/api/admin', contractorRoutes);
app.use('/api/admin', staffRoutes);
app.use('/api/admin', departmentsRoutes);
app.use('/api/admin/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/admin/vehicles', authenticateToken, vehiclesRoutes);
app.use('/api/amc', authenticateToken, amcRoutes);
app.use('/api/technical/test', testRoutes);
app.use('/api/business', authenticateToken, businessRoutes);

app.use('/api/acts', authenticateToken, actsRoutes);
app.use('/api/hr', authenticateToken, hrRoutes);
app.use('/api/technical-groups', authenticateToken, technicalGroupsRoutes);
app.use('/api/edofc/travels', travelsRouter);

// Register the new MMG module routes
console.log('App: Registering MMG routes...');
app.use('/api/mmg', mmgRouter);
app.use('/api/mmg/dashboard', mmgDashboardRouter);
console.log('App: MMG routes registered successfully');

// Add ED travels route
app.use('/api/ed/travels', travelsRouter);

// Add ED office dashboard routes
app.use('/api/edoffice/dashboard', authenticateToken, edofficeDashboardRoutes);

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

app.use('/api/acts/dashboard', authenticateToken, actsDashboardRoutes);
app.use('/api/hr/dashboard', authenticateToken, hrDashboardRoutes);

export default app; 