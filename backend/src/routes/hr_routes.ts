import express, { Router } from 'express';
import { addEmployee, addPromotion, changeGroup, recordAttrition, getEmployeeHistory } from '../services/hr_services';
import { authenticateToken } from '../middleware/auth';

const router: Router = express.Router();

// Employee routes
router.post('/employees', authenticateToken, addEmployee as express.RequestHandler);
router.get('/employees/:employee_id/history', authenticateToken, getEmployeeHistory as express.RequestHandler);

// Service routes
router.post('/services/promotions', authenticateToken, addPromotion as express.RequestHandler);
router.post('/services/group-changes', authenticateToken, changeGroup as express.RequestHandler);
router.post('/services/attrition', authenticateToken, recordAttrition as express.RequestHandler);

export default router; 