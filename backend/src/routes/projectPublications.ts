import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

console.log('Project Publications router initialized');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all publications
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('GET /api/project-publications/ route handler called');
  console.log('Request headers:', req.headers);
  
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { username } = req.user;
    console.log('User requesting publications:', username);

    const result = await pool.query(
      `SELECT pp.*, fp.project_name, tg.group_name
       FROM project_publications pp
       JOIN finance_projects fp ON pp.project_id = fp.project_id
       JOIN technical_groups tg ON fp.group_id = tg.group_id
       WHERE LOWER(tg.group_name) = LOWER($1)
       ORDER BY pp.publication_date DESC`,
      [username]
    );
    
    console.log('Publications query executed successfully, row count:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error in GET /api/project-publications/:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Get publications for a specific project
router.get('/project/:projectId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT * FROM project_publications 
       WHERE project_id = $1 
       ORDER BY publication_date DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Create new publication
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      project_id,
      type,
      title,
      details,
      publication_date,
      doi,
      group_id,
      publication_scope,
      impact_factor,
      internal_authors,
      external_authors
    } = req.body;

    // Construct authors string from internal and external authors
    let authors = '';
    const authorNames: string[] = [];

    // Get internal author names
    if (internal_authors && internal_authors.length > 0) {
      const employeeResult = await pool.query(
        'SELECT employee_name FROM hr_employees WHERE employee_id = ANY($1)',
        [internal_authors]
      );
      authorNames.push(...employeeResult.rows.map(row => row.employee_name));
    }

    // Add external authors
    if (external_authors && external_authors.length > 0) {
      authorNames.push(...external_authors);
    }

    // Join all author names
    authors = authorNames.join(', ');

    const result = await pool.query(
      `INSERT INTO project_publications 
       (project_id, type, title, details, publication_date, authors, doi, group_id, publication_scope, impact_factor, internal_authors, external_authors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [project_id, type, title, details, publication_date, authors, doi, group_id, publication_scope, impact_factor, internal_authors, external_authors]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating publication:', error);
    res.status(500).json({ error: 'Failed to create publication' });
  }
});

// Update publication
router.put('/:publicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicationId } = req.params;
    const {
      type,
      title,
      details,
      publication_date,
      doi,
      group_id,
      publication_scope,
      impact_factor,
      internal_authors,
      external_authors
    } = req.body;

    // Construct authors string from internal and external authors
    let authors = '';
    const authorNames: string[] = [];

    // Get internal author names
    if (internal_authors && internal_authors.length > 0) {
      const employeeResult = await pool.query(
        'SELECT employee_name FROM hr_employees WHERE employee_id = ANY($1)',
        [internal_authors]
      );
      authorNames.push(...employeeResult.rows.map(row => row.employee_name));
    }

    // Add external authors
    if (external_authors && external_authors.length > 0) {
      authorNames.push(...external_authors);
    }

    // Join all author names
    authors = authorNames.join(', ');

    const result = await pool.query(
      `UPDATE project_publications 
       SET type = $1,
           title = $2,
           details = $3,
           publication_date = $4,
           authors = $5,
           doi = $6,
           group_id = $7,
           publication_scope = $8,
           impact_factor = $9,
           internal_authors = $10,
           external_authors = $11
       WHERE publication_id = $12
       RETURNING *`,
      [type, title, details, publication_date, authors, doi, group_id, publication_scope, impact_factor, internal_authors, external_authors, publicationId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Publication not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating publication:', error);
    res.status(500).json({ error: 'Failed to update publication' });
  }
});

// Delete publication
router.delete('/:publicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { publicationId } = req.params;
    const result = await pool.query(
      'DELETE FROM project_publications WHERE publication_id = $1 RETURNING *',
      [publicationId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Publication not found' });
      return;
    }

    res.json({ message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    res.status(500).json({ error: 'Failed to delete publication' });
  }
});

// Get employees for internal authors dropdown
router.get('/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get all active employees from the organization
    const result = await pool.query(
      `SELECT employee_id, employee_name, technical_group_id
       FROM hr_employees
       WHERE status = 'active'
       ORDER BY employee_name`,
      []
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

export default router; 