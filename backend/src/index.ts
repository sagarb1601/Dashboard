import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/setup';
import authRoutes from './routes/auth';
import financeRoutes from './routes/finance';
import amcRoutes from './routes/amc';
import adminStaffRoutes from './routes/admin/staff';
import adminContractorsRoutes from './routes/admin/contractors';
import adminDepartmentsRoutes from './routes/admin/departments';
import adminVehiclesRoutes from './routes/admin/vehicles';
import actsRoutes from './routes/acts';
import hrRoutes from './routes/hr';
import hrServicesRouter from './routes/hr_services';
import manpowerRouter from './routes/manpower';
import financeRouter from './routes/finance';
import businessRouter from './routes/business';

const app = express();

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

// Initialize database
initializeDatabase().catch(console.error);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRouter);
app.use('/api/amc', amcRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/contractors', adminContractorsRoutes);
app.use('/api/admin/departments', adminDepartmentsRoutes);
app.use('/api/admin/vehicles', adminVehiclesRoutes);
app.use('/api/acts', actsRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr/services', hrServicesRouter);
app.use('/api/manpower', manpowerRouter);
app.use('/api/business', businessRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 