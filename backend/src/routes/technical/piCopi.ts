import { Router } from 'express';
import pool from '../../db';
import { authenticateToken as checkAuth } from '../../middleware/auth';

const router = Router();

interface ProjectInvestigator {
  id: number;
  project_id: number;
  project_name: string;
  employee_id: number;
  employee_name: string;
  role_type: 'PI' | 'Co-PI';
  created_at: Date;
  updated_at: Date;
}

// Get all PI/CoPI details with project and employee names
router.get('/', checkAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        pi.id,
        pi.project_id,
        p.project_name,
        pi.employee_id,
        e.employee_name,
        pi.role_type,
        pi.created_at,
        pi.updated_at
      FROM project_investigators pi
      JOIN finance_projects p ON pi.project_id = p.project_id
      JOIN hr_employees e ON pi.employee_id = e.employee_id
      ORDER BY p.project_name, pi.role_type DESC
    `;
    
    const result = await pool.query(query);
    
    // Restructure data to group PI and Co-PIs by project
    const projectMap = new Map();
    
    result.rows.forEach((row: ProjectInvestigator) => {
      const { project_id, project_name, employee_id, employee_name, role_type } = row;
      
      if (!projectMap.has(project_id)) {
        projectMap.set(project_id, {
          id: row.id,
          project_id,
          project_name,
          pi_id: null,
          pi_name: null,
          copi_ids: [],
          copi_names: []
        });
      }
      
      const project = projectMap.get(project_id);
      if (role_type === 'PI') {
        project.pi_id = employee_id;
        project.pi_name = employee_name;
      } else {
        project.copi_ids.push(employee_id);
        project.copi_names.push(employee_name);
      }
    });
    
    res.json(Array.from(projectMap.values()));
  } catch (error) {
    console.error('Error fetching PI/CoPI details:', error);
    res.status(500).json({ error: 'Failed to fetch PI/CoPI details' });
  }
});

// Add new PI/CoPI details
router.post('/', checkAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { project_id, pi_id, copi_ids } = req.body;

    await client.query('BEGIN');

    // Check if PI already exists for this project
    const existingPI = await client.query(
      'SELECT id FROM project_investigators WHERE project_id = $1 AND role_type = $2',
      [project_id, 'PI']
    );

    if (existingPI.rows.length > 0) {
      throw new Error('Project already has a PI assigned');
    }

    // Insert PI
    const piResult = await client.query(
      'INSERT INTO project_investigators (project_id, employee_id, role_type) VALUES ($1, $2, $3) RETURNING id',
      [project_id, pi_id, 'PI']
    );

    // Insert Co-PIs
    if (copi_ids && copi_ids.length > 0) {
      const copiValues = copi_ids.map((id: number) => 
        `(${project_id}, ${id}, 'Co-PI')`
      ).join(', ');
      
      await client.query(`
        INSERT INTO project_investigators (project_id, employee_id, role_type)
        VALUES ${copiValues}
      `);
    }

    await client.query('COMMIT');
    res.json({ message: 'PI/CoPI details added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding PI/CoPI details:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add PI/CoPI details' });
  } finally {
    client.release();
  }
});

// Update PI/CoPI details
router.put('/:id', checkAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { project_id, pi_id, copi_ids } = req.body;

    await client.query('BEGIN');

    // Delete existing entries for this project
    await client.query(
      'DELETE FROM project_investigators WHERE project_id = $1',
      [project_id]
    );

    // Insert new PI
    await client.query(
      'INSERT INTO project_investigators (project_id, employee_id, role_type) VALUES ($1, $2, $3)',
      [project_id, pi_id, 'PI']
    );

    // Insert new Co-PIs
    if (copi_ids && copi_ids.length > 0) {
      const copiValues = copi_ids.map((id: number) => 
        `(${project_id}, ${id}, 'Co-PI')`
      ).join(', ');
      
      await client.query(`
        INSERT INTO project_investigators (project_id, employee_id, role_type)
        VALUES ${copiValues}
      `);
    }

    await client.query('COMMIT');
    res.json({ message: 'PI/CoPI details updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating PI/CoPI details:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update PI/CoPI details' });
  } finally {
    client.release();
  }
});

// Delete PI/CoPI details for a project
router.delete('/:id', checkAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get project_id first
    const projectResult = await client.query(
      'SELECT project_id FROM project_investigators WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      throw new Error('PI/CoPI details not found');
    }

    const { project_id } = projectResult.rows[0];

    // Delete all entries for this project
    await client.query(
      'DELETE FROM project_investigators WHERE project_id = $1',
      [project_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'PI/CoPI details deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting PI/CoPI details:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete PI/CoPI details' });
  } finally {
    client.release();
  }
});

export default router; 