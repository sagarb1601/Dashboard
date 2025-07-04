import { Router } from 'express';
import contractorsRouter from './admin/contractors';
import staffRouter from './admin/staff';
import departmentsRouter from './admin/departments';
import financeDashboardRouter from './finance-dashboard';
import financeRouter from './finance';
import hrDashboardRouter from './hr-dashboard';
import edofficeDashboardRouter from './edoffice/dashboard';

const router = Router();

// Register admin routes
router.use('/admin/contractors', contractorsRouter);
router.use('/admin/staff', staffRouter);
router.use('/admin/departments', departmentsRouter);

// Register finance dashboard routes
router.use('/finance', financeDashboardRouter);

// Register main finance routes
router.use('/finance', financeRouter);

// Register HR dashboard routes
router.use('/hr/dashboard', hrDashboardRouter);

// Register edoffice dashboard routes
router.use('/edoffice/dashboard', edofficeDashboardRouter);

export default router; 