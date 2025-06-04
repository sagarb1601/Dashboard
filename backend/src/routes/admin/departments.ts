import { Router, RequestHandler } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { pool } from '../../db/setup';

interface Department {
  department_id: number;
  department_name: string;
}

interface ErrorResponse {
  error: string;
}

const router = Router();

// Get all departments
const getAllDepartments: RequestHandler<{}, Department[] | ErrorResponse> = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin_departments ORDER BY department_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Route handlers
router.get('/', authenticateToken, getAllDepartments);

export default router; 