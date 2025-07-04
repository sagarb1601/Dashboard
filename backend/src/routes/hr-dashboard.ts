import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Get HR dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/summary - Fetching HR summary');

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN EXTRACT(YEAR FROM join_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as new_hires_this_year,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN status != 'active' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as attrition_rate
      FROM hr_employees
      WHERE is_deleted = 'f' OR is_deleted IS NULL
    `);

    const summary = {
      total_employees: parseInt(result.rows[0]?.total_employees || '0'),
      active_employees: parseInt(result.rows[0]?.active_employees || '0'),
      new_hires_this_year: parseInt(result.rows[0]?.new_hires_this_year || '0'),
      attrition_rate: parseFloat(result.rows[0]?.attrition_rate || '0')
    };

    console.log('HR summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching HR summary:', error);
    res.status(500).json({ error: 'Failed to fetch HR summary' });
  }
});

// Get department distribution (using technical groups as departments)
router.get('/department-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/department-distribution - Fetching department distribution');

    const result = await pool.query(`
      SELECT 
        COALESCE(tg.group_name, 'Not Assigned') as department,
        COUNT(*) as employee_count
      FROM hr_employees he
      LEFT JOIN technical_groups tg ON he.technical_group_id = tg.group_id
      WHERE he.status = 'active' AND (he.is_deleted = 'f' OR he.is_deleted IS NULL)
      GROUP BY tg.group_name
      ORDER BY employee_count DESC
    `);

    const data = result.rows.map(row => ({
      department: row.department,
      employee_count: parseInt(row.employee_count)
    }));

    console.log('Department distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching department distribution:', error);
    res.status(500).json({ error: 'Failed to fetch department distribution' });
  }
});

// Get employee growth trend
router.get('/employee-growth', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/employee-growth - Fetching employee growth');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', join_date), 'Mon YYYY') as month,
        COUNT(*) as employee_count
      FROM hr_employees
      WHERE join_date >= CURRENT_DATE - INTERVAL '12 months'
        AND (is_deleted = 'f' OR is_deleted IS NULL)
      GROUP BY DATE_TRUNC('month', join_date)
      ORDER BY DATE_TRUNC('month', join_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      employee_count: parseInt(row.employee_count)
    }));

    console.log('Employee growth:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching employee growth:', error);
    res.status(500).json({ error: 'Failed to fetch employee growth' });
  }
});

// Get training summary
router.get('/training-summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/training-summary - Fetching training summary');

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_trainings,
        COUNT(CASE WHEN EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as trainings_this_year,
        SUM(attended_count) as total_participants,
        ROUND(AVG(attended_count), 0) as avg_participants_per_training
      FROM hr_training
      WHERE start_date >= CURRENT_DATE - INTERVAL '12 months'
    `);

    const summary = {
      total_trainings: parseInt(result.rows[0]?.total_trainings || '0'),
      trainings_this_year: parseInt(result.rows[0]?.trainings_this_year || '0'),
      total_participants: parseInt(result.rows[0]?.total_participants || '0'),
      avg_participants_per_training: parseInt(result.rows[0]?.avg_participants_per_training || '0')
    };

    console.log('Training summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching training summary:', error);
    res.status(500).json({ error: 'Failed to fetch training summary' });
  }
});

// Get training by type distribution
router.get('/training-by-type', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/training-by-type - Fetching training by type');

    const result = await pool.query(`
      SELECT 
        training_type,
        COUNT(*) as training_count,
        SUM(attended_count) as total_participants
      FROM hr_training
      WHERE start_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY training_type
      ORDER BY training_count DESC
    `);

    const data = result.rows.map(row => ({
      training_type: row.training_type,
      training_count: parseInt(row.training_count),
      total_participants: parseInt(row.total_participants)
    }));

    console.log('Training by type:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching training by type:', error);
    res.status(500).json({ error: 'Failed to fetch training by type' });
  }
});

// Get recruitment summary
router.get('/recruitment-summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/recruitment-summary - Fetching recruitment summary');

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_recruitments,
        COUNT(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as recruitments_this_year,
        SUM(recruited_count) as total_recruited,
        COUNT(CASE WHEN year = EXTRACT(YEAR FROM CURRENT_DATE) THEN recruited_count END) as recruited_this_year
      FROM hr_recruitment
      WHERE year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
    `);

    const summary = {
      total_recruitments: parseInt(result.rows[0]?.total_recruitments || '0'),
      recruitments_this_year: parseInt(result.rows[0]?.recruitments_this_year || '0'),
      total_recruited: parseInt(result.rows[0]?.total_recruited || '0'),
      recruited_this_year: parseInt(result.rows[0]?.recruited_this_year || '0')
    };

    console.log('Recruitment summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching recruitment summary:', error);
    res.status(500).json({ error: 'Failed to fetch recruitment summary' });
  }
});

// Get recruitment by mode
router.get('/recruitment-by-mode', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /hr/dashboard/recruitment-by-mode - Fetching recruitment by mode');

    const result = await pool.query(`
      SELECT 
        recruitment_mode,
        COUNT(*) as recruitment_count,
        SUM(recruited_count) as total_recruited
      FROM hr_recruitment
      WHERE year >= EXTRACT(YEAR FROM CURRENT_DATE) - 1
      GROUP BY recruitment_mode
      ORDER BY total_recruited DESC
    `);

    const data = result.rows.map(row => ({
      recruitment_mode: row.recruitment_mode,
      recruitment_count: parseInt(row.recruitment_count),
      total_recruited: parseInt(row.total_recruited)
    }));

    console.log('Recruitment by mode:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching recruitment by mode:', error);
    res.status(500).json({ error: 'Failed to fetch recruitment by mode' });
  }
});

export default router; 