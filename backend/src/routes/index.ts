import { Router } from 'express';
import contractorsRouter from './admin/contractors';
import staffRouter from './admin/staff';
import departmentsRouter from './admin/departments';
import calendarEventsRouter from './calendarEvents';

const router = Router();

// Register admin routes
router.use('/admin/contractors', contractorsRouter);
router.use('/admin/staff', staffRouter);
router.use('/admin/departments', departmentsRouter);
router.use('/api/calendar-events', calendarEventsRouter);

export default router; 