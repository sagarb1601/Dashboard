import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../db';

const router = Router();

// Get Technical Dashboard Summary
router.get('/summary', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/summary - Fetching technical summary');

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM technical_projects) as total_projects,
        (SELECT COUNT(*) FROM technical_projects tp
         LEFT JOIN technical_project_status tps ON tp.project_id = tps.project_id
         WHERE tps.status IS NULL OR tps.status IN ('Ongoing', 'Just Boarded')) as active_projects,
        (SELECT COUNT(*) FROM technical_projects tp
         LEFT JOIN technical_project_status tps ON tp.project_id = tps.project_id
         WHERE tps.status = 'Completed') as completed_projects,
        (SELECT COUNT(*) FROM project_publications) as total_publications,
        (SELECT COUNT(*) FROM patents) as total_patents,
        (SELECT COALESCE(COUNT(*), 0) FROM proposals) as total_proposals
    `);

    const summary = {
      total_projects: parseInt(result.rows[0]?.total_projects || '0'),
      active_projects: parseInt(result.rows[0]?.active_projects || '0'),
      completed_projects: parseInt(result.rows[0]?.completed_projects || '0'),
      total_publications: parseInt(result.rows[0]?.total_publications || '0'),
      total_patents: parseInt(result.rows[0]?.total_patents || '0'),
      total_proposals: parseInt(result.rows[0]?.total_proposals || '0')
    };

    console.log('Technical summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching technical summary:', error);
    res.status(500).json({ error: 'Failed to fetch technical summary' });
  }
});

// Get Projects per Month
router.get('/projects-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/projects-per-month - Fetching projects per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as project_count
      FROM technical_projects
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      project_count: parseInt(row.project_count)
    }));

    console.log('Projects per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching projects per month:', error);
    res.status(500).json({ error: 'Failed to fetch projects per month' });
  }
});

// Get Publications per Month
router.get('/publications-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/publications-per-month - Fetching publications per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', publication_date), 'Mon YYYY') as month,
        COUNT(*) as publication_count
      FROM project_publications
      GROUP BY DATE_TRUNC('month', publication_date)
      ORDER BY DATE_TRUNC('month', publication_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      publication_count: parseInt(row.publication_count)
    }));

    console.log('Publications per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching publications per month:', error);
    res.status(500).json({ error: 'Failed to fetch publications per month' });
  }
});

// Get Patents per Month
router.get('/patents-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/patents-per-month - Fetching patents per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', filing_date), 'Mon YYYY') as month,
        COUNT(*) as patent_count
      FROM patents
      WHERE filing_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', filing_date)
      ORDER BY DATE_TRUNC('month', filing_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      patent_count: parseInt(row.patent_count)
    }));

    console.log('Patents per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching patents per month:', error);
    res.status(500).json({ error: 'Failed to fetch patents per month' });
  }
});

// Get Proposals per Month
router.get('/proposals-per-month', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/proposals-per-month - Fetching proposals per month');

    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', submission_date), 'Mon YYYY') as month,
        COUNT(*) as proposal_count
      FROM proposals
      WHERE submission_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submission_date)
      ORDER BY DATE_TRUNC('month', submission_date)
    `);

    const data = result.rows.map(row => ({
      month: row.month,
      proposal_count: parseInt(row.proposal_count)
    }));

    console.log('Proposals per month:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching proposals per month:', error);
    res.status(500).json({ error: 'Failed to fetch proposals per month' });
  }
});

// Get Project Status Distribution - Since no status field, use group_name instead
router.get('/project-status-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/project-status-distribution - Fetching project group distribution');

    const result = await pool.query(`
      SELECT 
        group_name as status,
        COUNT(*) as project_count
      FROM technical_projects
      GROUP BY group_name
      ORDER BY project_count DESC
    `);

    const data = result.rows.map(row => ({
      status: row.status,
      project_count: parseInt(row.project_count)
    }));

    console.log('Project group distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching project group distribution:', error);
    res.status(500).json({ error: 'Failed to fetch project group distribution' });
  }
});

// Get Project Type Distribution - Since no project_type field, use group_name instead
router.get('/project-type-distribution', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/project-type-distribution - Fetching project group distribution');

    const result = await pool.query(`
      SELECT 
        group_name as project_type,
        COUNT(*) as project_count
      FROM technical_projects
      GROUP BY group_name
      ORDER BY project_count DESC
    `);

    const data = result.rows.map(row => ({
      project_type: row.project_type,
      project_count: parseInt(row.project_count)
    }));

    console.log('Project group distribution:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching project group distribution:', error);
    res.status(500).json({ error: 'Failed to fetch project group distribution' });
  }
});

// Get Publications by Type
router.get('/publications-by-type', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/publications-by-type - Fetching publications by type');

    const result = await pool.query(`
      SELECT 
        type as publication_type,
        COUNT(*) as publication_count
      FROM project_publications
      GROUP BY type
      ORDER BY publication_count DESC
    `);

    const data = result.rows.map(row => ({
      publication_type: row.publication_type,
      publication_count: parseInt(row.publication_count)
    }));

    console.log('Publications by type:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching publications by type:', error);
    res.status(500).json({ error: 'Failed to fetch publications by type' });
  }
});

// Get Patents by Status
router.get('/patents-by-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /technical/dashboard/patents-by-status - Fetching patents by status');

    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as patent_count
      FROM patents
      GROUP BY status
      ORDER BY patent_count DESC
    `);

    const data = result.rows.map(row => ({
      status: row.status,
      patent_count: parseInt(row.patent_count)
    }));

    console.log('Patents by status:', data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching patents by status:', error);
    res.status(500).json({ error: 'Failed to fetch patents by status' });
  }
});

export default router; 