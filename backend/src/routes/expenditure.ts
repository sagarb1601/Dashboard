import { Router } from 'express';
import { pool } from '../db/setup';
import { authenticateToken } from '../middleware/auth';
import { QueryResult } from 'pg';

interface ExpenditureEntry {
  expenditure_id: number;
  project_id: number;
  field_id: number;
  year_number: number;
  period_type: string;
  period_number: number;
  amount_spent: number;
  expenditure_date: Date;
  remarks?: string;
}

const router = Router();

// Test endpoint to check if routes are accessible
router.get('/test', (req, res) => {
  console.log('Expenditure test endpoint hit!');
  res.json({ message: 'Expenditure routes are working' });
});

// Get expenditures for a project
router.get('/expenditures/:projectId', authenticateToken, async (req, res) => {
  console.log('Expenditure endpoint hit! Project ID:', req.params.projectId);
  try {
    const { projectId } = req.params;
    console.log('Querying database for project ID:', projectId);
    const result = await pool.query(
      `SELECT * FROM project_expenditure_entries 
       WHERE project_id = $1 
       ORDER BY year_number, period_type, period_number, field_id`,
      [projectId]
    );
    console.log('Query result rows:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ error: 'Failed to fetch expenditures' });
  }
});

// Delete an expenditure entry
router.delete('/expenditures/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'DELETE FROM project_expenditure_entries WHERE expenditure_id = $1',
      [id]
    );
    res.json({ message: 'Expenditure deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ error: 'Failed to delete expenditure' });
  }
});

function getFinancialYearEnd(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JS months are 0-based
  // If month is April (4) or later, financial year ends next year
  return month >= 4 ? year + 1 : year;
}

export default router; 