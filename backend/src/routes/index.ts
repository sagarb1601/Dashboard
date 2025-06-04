import { Router } from 'express';
import contractorsRouter from './admin/contractors';
import staffRouter from './admin/staff';
import departmentsRouter from './admin/departments';

const router = Router();

// Register admin routes
router.use('/admin/contractors', contractorsRouter);
router.use('/admin/staff', staffRouter);
router.use('/admin/departments', departmentsRouter);

export default router; 