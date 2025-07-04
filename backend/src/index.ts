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
import adminDashboardRoutes from './routes/admin/dashboard';
import actsRoutes from './routes/acts';
import actsDashboardRoutes from './routes/acts-dashboard';
import hrRoutes from './routes/hr';
import hrDashboardRoutes from './routes/hr-dashboard';
import hrServicesRouter from './routes/hr_services';
import manpowerRouter from './routes/manpower';
import financeRouter from './routes/finance';
import businessRouter from './routes/business';
import businessDashboardRoutes from './routes/business-dashboard';
import projectStatusRoutes from './routes/project-status';
import projectEventsRoutes from './routes/projectEvents';
import projectPublicationsRoutes from './routes/projectPublications';
import piCopiRoutes from './routes/technical/piCopi';
import patentsRoutes from './routes/technical/patents';
import proposalsRoutes from './routes/technical/proposals';
import businessAgreementsRoutes from './routes/business/agreements';
import slaFundsRoutes from './routes/business/slaFunds';
import calendarEventsRouter from './routes/calendarEvents';
import travelsRouter from './routes/travels';
import talksRouter from './routes/talks';
import mmgRouter from './routes/mmg';
import mmgDashboardRoutes from './routes/mmg-dashboard';
import technicalDashboardRoutes from './routes/technical-dashboard';
import financeDashboardRouter from './routes/finance-dashboard';
import edofficeDashboardRoutes from './routes/edoffice/dashboard';
import { authenticateToken } from './middleware/auth';

const app = express();

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],  // Frontend URL
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
app.use('/api/finance', financeRoutes);
app.use('/api/amc', amcRoutes);
app.use('/api/admin/staff', adminStaffRoutes);
app.use('/api/admin/contractors', adminContractorsRoutes);
app.use('/api/admin/departments', adminDepartmentsRoutes);
app.use('/api/admin/vehicles', adminVehiclesRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/acts', actsRoutes);
app.use('/api/acts/dashboard', authenticateToken, actsDashboardRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/hr/dashboard', authenticateToken, hrDashboardRoutes);
app.use('/api/hr/services', hrServicesRouter);
app.use('/api/manpower', manpowerRouter);
app.use('/api/business', businessRouter);
app.use('/api/business/dashboard', authenticateToken, businessDashboardRoutes);
app.use('/api/project-status', projectStatusRoutes);
app.use('/api/project-events', projectEventsRoutes);
app.use('/api/project-publications', projectPublicationsRoutes);
app.use('/api/technical/pi-copi', piCopiRoutes);
app.use('/api/technical/patents', patentsRoutes);
app.use('/api/technical/proposals', proposalsRoutes);
app.use('/api/business/agreements', businessAgreementsRoutes);
app.use('/api/business/sla-funds', slaFundsRoutes);
app.use('/api/calendar-events', calendarEventsRouter);
app.use('/api/edofc/travels', travelsRouter);
app.use('/api/ed/travels', travelsRouter);
app.use('/api/edofc/talks', talksRouter);
app.use('/api/mmg', mmgRouter);
app.use('/api/mmg/dashboard', authenticateToken, mmgDashboardRoutes);
app.use('/api/technical/dashboard', authenticateToken, technicalDashboardRoutes);
app.use('/api/finance/dashboard', financeDashboardRouter);
app.use('/api/edoffice/dashboard', edofficeDashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 