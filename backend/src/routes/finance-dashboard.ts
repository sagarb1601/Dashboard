import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

// Test route to verify finance-dashboard routes are working
router.get('/test', (req: Request, res: Response) => {
  console.log('Finance Dashboard test route hit!');
  res.json({ message: 'Finance Dashboard routes are working!' });
});

// Test expenditure route
router.get('/expenditure-test', (req: Request, res: Response) => {
  console.log('Expenditure test route hit!');
  res.json({ message: 'Expenditure routes are working!' });
});

// Get overall financial summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total projects count
    const totalProjectsResult = await pool.query(`
      SELECT COUNT(*) as total_projects 
      FROM finance_projects
    `);

    // Get total project value
    const totalValueResult = await pool.query(`
      SELECT COALESCE(SUM(total_value), 0) as total_value 
      FROM finance_projects
    `);

    // Get current year spending
    const currentYear = new Date().getFullYear();
    const currentYearSpendingResult = await pool.query(`
      SELECT COALESCE(SUM(amount_spent), 0) as current_year_spent
      FROM project_expenditure_entries 
      WHERE year_number = $1
    `, [currentYear]);

    // Get current year budget (from budget entries)
    const currentYearBudgetResult = await pool.query(`
      SELECT COALESCE(SUM(pbe.amount), 0) as current_year_budget
      FROM project_budget_entries pbe
      JOIN finance_projects fp ON pbe.project_id = fp.project_id
      WHERE pbe.year_number = $1
    `, [currentYear]);

    // Get expenditure summary data
    const expenditureResult = await pool.query(`
      SELECT 
        fp.project_id,
        fp.project_name,
        fp.total_value as total_budget,
        COALESCE(SUM(pee.amount_spent), 0) as total_expenditure,
        (fp.total_value - COALESCE(SUM(pee.amount_spent), 0)) as remaining_budget,
        CASE 
          WHEN fp.total_value > 0 THEN 
            (COALESCE(SUM(pee.amount_spent), 0) / fp.total_value) * 100
          ELSE 0 
        END as utilization_percentage,
        COALESCE(ps.status, 'Unknown') as status,
        tg.group_name,
        fp.start_date,
        fp.end_date
      FROM finance_projects fp
      LEFT JOIN project_expenditure_entries pee ON fp.project_id = pee.project_id
      LEFT JOIN project_status ps ON fp.project_id = ps.project_id
      LEFT JOIN technical_groups tg ON fp.group_id = tg.group_id
      GROUP BY fp.project_id, fp.project_name, fp.total_value, ps.status, tg.group_name, fp.start_date, fp.end_date
      ORDER BY fp.project_name
    `);

    console.log('Expenditure query result rows:', expenditureResult.rows.length);
    console.log('First few expenditure rows:', expenditureResult.rows.slice(0, 3));

    const summary = {
      total_projects: parseInt(totalProjectsResult.rows[0].total_projects),
      total_value: parseFloat(totalValueResult.rows[0].total_value),
      current_year_spent: parseFloat(currentYearSpendingResult.rows[0].current_year_spent),
      current_year_budget: parseFloat(currentYearBudgetResult.rows[0].current_year_budget),
      current_year_pending: parseFloat(currentYearBudgetResult.rows[0].current_year_budget) - parseFloat(currentYearSpendingResult.rows[0].current_year_spent),
      expenditure_summary: expenditureResult.rows.map(row => ({
        project_id: parseInt(row.project_id),
        project_name: row.project_name,
        total_budget: parseFloat(row.total_budget),
        total_expenditure: parseFloat(row.total_expenditure),
        remaining_budget: parseFloat(row.remaining_budget),
        utilization_percentage: parseFloat(row.utilization_percentage),
        status: row.status,
        group_name: row.group_name || 'Unknown',
        start_date: row.start_date,
        end_date: row.end_date
      }))
    };

    console.log('Summary response expenditure_summary length:', summary.expenditure_summary.length);
    console.log('Summary response keys:', Object.keys(summary));

    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group-wise projects
router.get('/group-projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        tg.group_name,
        COUNT(fp.project_id) as project_count,
        COALESCE(SUM(fp.total_value), 0) as total_budget,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(pee.amount_spent), 0) 
           FROM project_expenditure_entries pee 
           WHERE pee.project_id = fp.project_id)
        ), 0) as total_spent
      FROM technical_groups tg
      LEFT JOIN finance_projects fp ON tg.group_id = fp.group_id
      GROUP BY tg.group_id, tg.group_name
      ORDER BY total_budget DESC
    `);

    const groupProjects = result.rows.map(row => ({
      group_name: row.group_name,
      project_count: parseInt(row.project_count),
      total_budget: parseFloat(row.total_budget),
      total_spent: parseFloat(row.total_spent),
      pending_amount: parseFloat(row.total_budget) - parseFloat(row.total_spent)
    }));

    res.json(groupProjects);
  } catch (error) {
    console.error('Error fetching group projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project status distribution
router.get('/project-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(ps.status, 'Unknown') as project_status,
        COUNT(fp.project_id) as project_count,
        COALESCE(SUM(fp.total_value), 0) as total_value
      FROM finance_projects fp
      LEFT JOIN project_status ps ON fp.project_id = ps.project_id
      GROUP BY ps.status
      ORDER BY project_count DESC
    `);

    const projectStatus = result.rows.map(row => ({
      status: row.project_status,
      count: parseInt(row.project_count),
      value: parseFloat(row.total_value)
    }));

    res.json(projectStatus);
  } catch (error) {
    console.error('Error fetching project status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get yearly spending data
router.get('/yearly-spending', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get current year data
    const currentYearResult = await pool.query(`
      SELECT 
        COALESCE(SUM(pee.amount_spent), 0) as total_spent,
        COALESCE(SUM(pbe.amount), 0) as total_budget
      FROM project_expenditure_entries pee
      FULL OUTER JOIN project_budget_entries pbe ON pee.project_id = pbe.project_id AND pee.year_number = pbe.year_number
      WHERE pee.year_number = $1 OR pbe.year_number = $1
    `, [currentYear]);

    // Get previous year data for comparison
    const previousYearResult = await pool.query(`
      SELECT 
        COALESCE(SUM(pee.amount_spent), 0) as total_spent,
        COALESCE(SUM(pbe.amount), 0) as total_budget
      FROM project_expenditure_entries pee
      FULL OUTER JOIN project_budget_entries pbe ON pee.project_id = pbe.project_id AND pee.year_number = pbe.year_number
      WHERE pee.year_number = $1 OR pbe.year_number = $1
    `, [currentYear - 1]);

    const yearlySpending = {
      current_year: {
        year: currentYear,
        spent: parseFloat(currentYearResult.rows[0].total_spent),
        budget: parseFloat(currentYearResult.rows[0].total_budget),
        pending: parseFloat(currentYearResult.rows[0].total_budget) - parseFloat(currentYearResult.rows[0].total_spent)
      },
      previous_year: {
        year: currentYear - 1,
        spent: parseFloat(previousYearResult.rows[0].total_spent),
        budget: parseFloat(previousYearResult.rows[0].total_budget),
        pending: parseFloat(previousYearResult.rows[0].total_budget) - parseFloat(previousYearResult.rows[0].total_spent)
      }
    };

    res.json(yearlySpending);
  } catch (error) {
    console.error('Error fetching yearly spending:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get monthly trends
router.get('/monthly-trend', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const currentYear = new Date().getFullYear();
    
    const result = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM pee.expenditure_date) as month,
        COALESCE(SUM(pee.amount_spent), 0) as monthly_spent
      FROM project_expenditure_entries pee
      WHERE EXTRACT(YEAR FROM pee.expenditure_date) = $1
      GROUP BY EXTRACT(MONTH FROM pee.expenditure_date)
      ORDER BY month
    `, [currentYear]);

    const monthlyTrends = result.rows.map(row => ({
      month: parseInt(row.month),
      month_name: new Date(currentYear, parseInt(row.month) - 1).toLocaleString('default', { month: 'long' }),
      spent: parseFloat(row.monthly_spent)
    }));

    res.json(monthlyTrends);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top projects by value
router.get('/top-projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        fp.project_name,
        fp.total_value,
        COALESCE(ps.status, 'Unknown') as status,
        tg.group_name,
        COALESCE(SUM(pee.amount_spent), 0) as total_spent
      FROM finance_projects fp
      LEFT JOIN technical_groups tg ON fp.group_id = tg.group_id
      LEFT JOIN project_status ps ON fp.project_id = ps.project_id
      LEFT JOIN project_expenditure_entries pee ON fp.project_id = pee.project_id
      GROUP BY fp.project_id, fp.project_name, fp.total_value, ps.status, tg.group_name
      ORDER BY fp.total_value DESC
      LIMIT 10
    `);

    const topProjects = result.rows.map(row => ({
      project_name: row.project_name,
      total_budget: parseFloat(row.total_value),
      total_spent: parseFloat(row.total_spent),
      pending_amount: parseFloat(row.total_value) - parseFloat(row.total_spent),
      status: row.status,
      group_name: row.group_name
    }));

    res.json(topProjects);
  } catch (error) {
    console.error('Error fetching top projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expenditure summary for all projects
router.get('/expenditure-summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        fp.project_id,
        fp.project_name,
        fp.total_value as total_budget,
        COALESCE(SUM(pee.amount_spent), 0) as total_expenditure,
        (fp.total_value - COALESCE(SUM(pee.amount_spent), 0)) as remaining_budget,
        CASE 
          WHEN fp.total_value > 0 THEN 
            (COALESCE(SUM(pee.amount_spent), 0) / fp.total_value) * 100
          ELSE 0 
        END as utilization_percentage,
        COALESCE(ps.status, 'Unknown') as status,
        tg.group_name,
        fp.start_date,
        fp.end_date
      FROM finance_projects fp
      LEFT JOIN project_expenditure_entries pee ON fp.project_id = pee.project_id
      LEFT JOIN project_status ps ON fp.project_id = ps.project_id
      LEFT JOIN technical_groups tg ON fp.group_id = tg.group_id
      GROUP BY fp.project_id, fp.project_name, fp.total_value, ps.status, tg.group_name, fp.start_date, fp.end_date
      ORDER BY fp.project_name
    `);

    const expenditureSummary = result.rows.map(row => ({
      project_id: parseInt(row.project_id),
      project_name: row.project_name,
      total_budget: parseFloat(row.total_budget),
      total_expenditure: parseFloat(row.total_expenditure),
      remaining_budget: parseFloat(row.remaining_budget),
      utilization_percentage: parseFloat(row.utilization_percentage),
      status: row.status,
      group_name: row.group_name || 'Unknown',
      start_date: row.start_date,
      end_date: row.end_date
    }));

    res.json(expenditureSummary);
  } catch (error) {
    console.error('Error fetching expenditure summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed expenditure for a specific project
router.get('/expenditure-project/:projectId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        pee.expenditure_id,
        fp.project_name,
        pee.expenditure_date,
        pee.amount_spent as amount,
        pee.description,
        pee.category,
        pee.vendor,
        pee.payment_status,
        pee.invoice_number
      FROM project_expenditure_entries pee
      JOIN finance_projects fp ON pee.project_id = fp.project_id
      WHERE pee.project_id = $1
      ORDER BY pee.expenditure_date DESC
    `, [projectId]);

    const projectExpenditureDetails = result.rows.map(row => ({
      expenditure_id: parseInt(row.expenditure_id),
      project_name: row.project_name,
      expenditure_date: row.expenditure_date,
      amount: parseFloat(row.amount),
      description: row.description || 'No description',
      category: row.category || 'Uncategorized',
      vendor: row.vendor || 'Unknown',
      payment_status: row.payment_status || 'Unknown',
      invoice_number: row.invoice_number || 'N/A'
    }));

    res.json(projectExpenditureDetails);
  } catch (error) {
    console.error('Error fetching project expenditure details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 