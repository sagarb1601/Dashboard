import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import pool from '../../db';

const router = Router();

// Get admin dashboard summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/summary - Fetching admin summary');

    // Get staff summary
    const staffResult = await pool.query(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_staff
      FROM admin_staff
    `);

    // Get contractor summary - check if status column exists in mapping table
    const contractorResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.contractor_id) as total_contractors,
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM admin_contractor_department_mapping m2 
            WHERE m2.contractor_id = c.contractor_id 
            AND m2.end_date >= CURRENT_DATE
          ) THEN c.contractor_id 
        END) as active_contractors
      FROM admin_contractors c
    `);

    // Get vehicle summary - check if status column exists
    const vehicleResult = await pool.query(`
      SELECT 
        COUNT(*) as total_vehicles,
        COUNT(*) as operational_vehicles
      FROM transport_vehicles
    `);

    // Get AMC summary
    const amcResult = await pool.query(`
      SELECT 
        COUNT(*) as total_amc_contracts,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_amc_contracts
      FROM amc_contracts
    `);

    const summary = {
      total_staff: parseInt(staffResult.rows[0]?.total_staff || '0'),
      active_staff: parseInt(staffResult.rows[0]?.active_staff || '0'),
      total_contractors: parseInt(contractorResult.rows[0]?.total_contractors || '0'),
      active_contractors: parseInt(contractorResult.rows[0]?.active_contractors || '0'),
      total_vehicles: parseInt(vehicleResult.rows[0]?.total_vehicles || '0'),
      operational_vehicles: parseInt(vehicleResult.rows[0]?.operational_vehicles || '0'),
      total_amc_contracts: parseInt(amcResult.rows[0]?.total_amc_contracts || '0'),
      active_amc_contracts: parseInt(amcResult.rows[0]?.active_amc_contracts || '0')
    };

    console.log('Admin summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    res.status(500).json({ error: 'Failed to fetch admin summary' });
  }
});

// Get staff by department
router.get('/staff-by-department', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/staff-by-department - Fetching staff by department');

    const result = await pool.query(`
      SELECT 
        d.department_name,
        COUNT(s.staff_id) as staff_count
      FROM admin_departments d
      LEFT JOIN admin_staff s ON d.department_id = s.department_id AND s.status = 'ACTIVE'
      GROUP BY d.department_id, d.department_name
      ORDER BY staff_count DESC
    `);

    console.log('Staff by department:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff by department:', error);
    res.status(500).json({ error: 'Failed to fetch staff by department' });
  }
});

// Get contractor status distribution
router.get('/contractor-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/contractor-status - Fetching contractor status');

    const result = await pool.query(`
      SELECT 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM admin_contractor_department_mapping m2 
            WHERE m2.contractor_id = c.contractor_id 
            AND m2.end_date >= CURRENT_DATE
          ) THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END as status,
        COUNT(DISTINCT c.contractor_id) as count
      FROM admin_contractors c
      GROUP BY 
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM admin_contractor_department_mapping m2 
            WHERE m2.contractor_id = c.contractor_id 
            AND m2.end_date >= CURRENT_DATE
          ) THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END
      ORDER BY count DESC
    `);

    console.log('Contractor status:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contractor status:', error);
    res.status(500).json({ error: 'Failed to fetch contractor status' });
  }
});

// Get vehicle status distribution
router.get('/vehicle-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/vehicle-status - Fetching vehicle status');

    const result = await pool.query(`
      SELECT 
        'OPERATIONAL' as status,
        COUNT(*) as count
      FROM transport_vehicles
    `);

    console.log('Vehicle status:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicle status:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle status' });
  }
});

// Get AMC status distribution
router.get('/amc-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/amc-status - Fetching AMC status');

    const result = await pool.query(`
      SELECT 
        COALESCE(status, 'UNKNOWN') as status,
        COUNT(*) as count
      FROM amc_contracts
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('AMC status:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AMC status:', error);
    res.status(500).json({ error: 'Failed to fetch AMC status' });
  }
});

// Get monthly trends
router.get('/monthly-trends', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/dashboard/monthly-trends - Fetching monthly trends');

    // Get last 6 months
    const result = await pool.query(`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        ) as month
      ),
      staff_trends AS (
        SELECT 
          date_trunc('month', joining_date) as month,
          COUNT(*) as staff_joined
        FROM admin_staff
        WHERE joining_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY date_trunc('month', joining_date)
      ),
      contractor_trends AS (
        SELECT 
          date_trunc('month', m.start_date) as month,
          COUNT(DISTINCT c.contractor_id) as contractors_added
        FROM admin_contractor_department_mapping m
        JOIN admin_contractors c ON m.contractor_id = c.contractor_id
        WHERE m.start_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY date_trunc('month', m.start_date)
      ),
      vehicle_trends AS (
        SELECT 
          date_trunc('month', created_at) as month,
          COUNT(*) as vehicles_added
        FROM transport_vehicles
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
      )
      SELECT 
        to_char(m.month, 'Mon YYYY') as month,
        COALESCE(st.staff_joined, 0) as staff_joined,
        COALESCE(ct.contractors_added, 0) as contractors_added,
        COALESCE(vt.vehicles_added, 0) as vehicles_added
      FROM months m
      LEFT JOIN staff_trends st ON m.month = st.month
      LEFT JOIN contractor_trends ct ON m.month = ct.month
      LEFT JOIN vehicle_trends vt ON m.month = vt.month
      ORDER BY m.month
    `);

    console.log('Monthly trends:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ error: 'Failed to fetch monthly trends' });
  }
});

export default router; 