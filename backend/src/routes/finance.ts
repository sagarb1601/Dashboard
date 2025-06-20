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

// Get all projects
router.get('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, tg.group_name as technical_group_name 
       FROM finance_projects p
       LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new project
router.post('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const {
      project_name,
      start_date,
      end_date,
      extension_end_date,
      total_value,
      funding_agency,
      duration_years,
      group_id
    } = req.body;

    await client.query('BEGIN');

    // Create the project
    const projectResult = await client.query(
      'INSERT INTO finance_projects (project_name, start_date, end_date, extension_end_date, total_value, funding_agency, duration_years, group_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [project_name, start_date, end_date, extension_end_date, total_value, funding_agency, duration_years, group_id]
    );
    const project = projectResult.rows[0];

    // Get all default budget fields
    const defaultFieldsResult = await client.query(
      'SELECT field_id FROM budget_fields WHERE is_default = true'
    );

    // Map default budget fields to the project
    for (const field of defaultFieldsResult.rows) {
      await client.query(
        'INSERT INTO project_budget_fields_mapping (project_id, field_id, is_custom) VALUES ($1, $2, false)',
        [project.project_id, field.field_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(project);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get a specific project
router.get('/projects/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM finance_projects WHERE project_id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a project
router.put('/projects/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const {
      project_name,
      start_date,
      end_date,
      extension_end_date,
      total_value,
      funding_agency,
      duration_years,
      group_id,
      budget_fields
    } = req.body;

    const result = await client.query(
      `UPDATE finance_projects 
       SET project_name = $1, 
           start_date = $2, 
           end_date = $3, 
           extension_end_date = $4, 
           total_value = $5, 
           funding_agency = $6, 
           duration_years = $7, 
           group_id = $8
       WHERE project_id = $9 
       RETURNING *`,
      [project_name, start_date, end_date, extension_end_date, total_value, funding_agency, duration_years, group_id, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Update budget fields if provided
    if (budget_fields && budget_fields.length > 0) {
      // First delete existing budget entries
      await pool.query('DELETE FROM project_budget_entries WHERE project_id = $1', [id]);
      
      // Then insert new ones
      for (const field of budget_fields) {
        await pool.query(
          'INSERT INTO project_budget_entries (project_id, field_id, year_number, amount) VALUES ($1, $2, $3, $4)',
          [id, field.field_id, field.year_number, field.amount]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Delete a project
router.delete('/projects/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    console.log(`Starting deletion of project ${id} and its related data...`);
    await client.query('BEGIN');

    // First delete all related data
    try {
      // Delete grant received entries first
      console.log('Deleting grant received entries...');
      const grantResult = await client.query(
        'DELETE FROM grant_received WHERE project_id = $1 RETURNING grant_id',
        [id]
      );
      console.log(`Deleted ${grantResult.rowCount} grant received entries`);

      // Delete expenditures
      console.log('Deleting expenditure entries...');
      const expResult = await client.query(
        'DELETE FROM project_expenditure_entries WHERE project_id = $1 RETURNING expenditure_id',
        [id]
      );
      console.log(`Deleted ${expResult.rowCount} expenditure entries`);

      // Delete budget entries
      console.log('Deleting budget entries...');
      const budgetResult = await client.query(
        'DELETE FROM project_budget_entries WHERE project_id = $1 RETURNING entry_id',
        [id]
      );
      console.log(`Deleted ${budgetResult.rowCount} budget entries`);

      // Delete budget field mappings
      console.log('Deleting budget field mappings...');
      const mappingResult = await client.query(
        'DELETE FROM project_budget_fields_mapping WHERE project_id = $1 RETURNING field_id',
        [id]
      );
      console.log(`Deleted ${mappingResult.rowCount} budget field mappings`);

      // Delete PI/CoPI entries
      console.log('Deleting PI/CoPI entries...');
      const piResult = await client.query(
        'DELETE FROM project_investigators WHERE project_id = $1 RETURNING id',
        [id]
      );
      console.log(`Deleted ${piResult.rowCount} PI/CoPI entries`);

      // Delete project status
      console.log('Deleting project status...');
      const statusResult = await client.query(
        'DELETE FROM technical_project_status WHERE project_id = $1 RETURNING project_id',
        [id]
      );
      console.log(`Deleted ${statusResult.rowCount} project status entries`);

      // Finally delete the project
      console.log('Deleting project...');
      const result = await client.query(
        'DELETE FROM finance_projects WHERE project_id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        console.log('Project not found, rolling back transaction...');
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      console.log('Project deleted successfully, committing transaction...');
      await client.query('COMMIT');
      res.json({ 
        message: 'Project and all related data deleted successfully',
        details: {
          grants: grantResult.rowCount,
          expenditures: expResult.rowCount,
          budgetEntries: budgetResult.rowCount,
          budgetMappings: mappingResult.rowCount,
          piEntries: piResult.rowCount,
          statusEntries: statusResult.rowCount
        }
      });
    } catch (error) {
      console.error('Error during deletion process:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any).code,
        constraint: (error as any).constraint
      });
      await client.query('ROLLBACK');
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error in project deletion endpoint:', error);
    console.error('Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any).code,
      constraint: (error as any).constraint
    });
    
    // Check for specific database errors
    if ((error as any).code === '23503') { // foreign key violation
      res.status(400).json({ 
        error: 'Cannot delete project because it has related records in other tables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete project',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any).code
      });
    }
  } finally {
    client.release();
    console.log('Database connection released');
  }
});

// Get all budget fields
router.get('/budget-fields', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM budget_fields ORDER BY is_default DESC, field_name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budget fields:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new budget field
router.post('/budget-fields', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { field_name, is_default } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO budget_fields (
        field_name,
        is_default
      ) VALUES ($1, $2) RETURNING *`,
      [field_name, is_default]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating budget field:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a budget field
router.put('/budget-fields', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { field_id, field_name, is_default } = req.body;

  try {
    // Check if the field is a default field
    const checkResult = await pool.query(
      'SELECT is_default FROM budget_fields WHERE field_id = $1',
      [field_id]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: 'Budget field not found' });
      return;
    }

    // Only allow updating the name if it's a default field
    if (checkResult.rows[0].is_default) {
      const result = await pool.query(
        'UPDATE budget_fields SET field_name = $1 WHERE field_id = $2 RETURNING *',
        [field_name, field_id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'UPDATE budget_fields SET field_name = $1, is_default = $2 WHERE field_id = $3 RETURNING *',
        [field_name, is_default, field_id]
      );
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating budget field:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a budget field
router.delete('/budget-fields/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const fieldId = req.params.id;

  try {
    // Check if the field is a default field
    const checkResult = await pool.query(
      'SELECT is_default FROM budget_fields WHERE field_id = $1',
      [fieldId]
    );

    if (checkResult.rows.length === 0) {
      res.status(404).json({ message: 'Budget field not found' });
      return;
    }

    if (checkResult.rows[0].is_default) {
      res.status(400).json({ message: 'Cannot delete default budget fields' });
      return;
    }

    await pool.query(
      'DELETE FROM budget_fields WHERE field_id = $1',
      [fieldId]
    );

    res.json({ message: 'Budget field deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget field:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get project budget fields
router.get('/projects/:projectId/budget-fields', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT bf.* FROM budget_fields bf
       INNER JOIN project_budget_fields_mapping pbfm ON bf.field_id = pbfm.field_id
       WHERE pbfm.project_id = $1`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching project budget fields:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add budget field to project
router.post('/projects/:projectId/budget-fields', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { field_id, is_custom } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO project_budget_fields_mapping (project_id, field_id, is_custom) VALUES ($1, $2, $3) RETURNING *',
      [projectId, field_id, is_custom]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding budget field to project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove budget field from project
router.delete('/projects/:projectId/budget-fields/:fieldId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId, fieldId } = req.params;

  try {
    await pool.query(
      'DELETE FROM project_budget_fields_mapping WHERE project_id = $1 AND field_id = $2',
      [projectId, fieldId]
    );
    res.json({ message: 'Budget field removed from project successfully' });
  } catch (error) {
    console.error('Error removing budget field from project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project details
router.get('/projects/:projectId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM finance_projects WHERE project_id = $1',
      [req.params.projectId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get budget entries for a project
router.get('/projects/:projectId/budget-entries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM project_budget_entries WHERE project_id = $1 ORDER BY year_number, field_id',
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budget entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all budget entries for a project
router.delete('/projects/:projectId/budget-entries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(
      'DELETE FROM project_budget_entries WHERE project_id = $1',
      [req.params.projectId]
    );
    res.json({ message: 'Budget entries deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create multiple budget entries for a project
router.post('/projects/:projectId/budget-entries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { entries } = req.body;
    if (!Array.isArray(entries)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Validate all entries before inserting
    for (const entry of entries) {
      if (!entry.field_id || !entry.year_number || entry.amount === undefined) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Invalid entry data' });
        return;
      }
    }

    // Insert all entries
    for (const entry of entries) {
      await client.query(
        'INSERT INTO project_budget_entries (project_id, field_id, year_number, amount) VALUES ($1, $2, $3, $4)',
        [req.params.projectId, entry.field_id, entry.year_number, entry.amount]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Budget entries created successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating budget entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get expenditures for a project
router.get('/projects/:projectId/expenditures', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT e.*, bf.field_name 
       FROM project_expenditure_entries e
       INNER JOIN budget_fields bf ON e.field_id = bf.field_id
       WHERE e.project_id = $1
       ORDER BY e.expenditure_date DESC, e.field_id`,
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new expenditure entry
router.post('/projects/:projectId/expenditures', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const {
    field_id,
    year_number,
    period_type,
    period_number,
    amount_spent,
    expenditure_date,
    remarks
  } = req.body;

  try {
    // Validate that the field is mapped to the project
    const fieldCheck = await pool.query(
      'SELECT 1 FROM project_budget_fields_mapping WHERE project_id = $1 AND field_id = $2',
      [projectId, field_id]
    );

    if (fieldCheck.rows.length === 0) {
      res.status(400).json({ error: 'Selected budget field is not mapped to this project' });
      return;
    }

    const date = new Date(expenditure_date);
    const year_number = date.getFullYear();
    const period_number = Math.floor((date.getMonth() + 3) / 3);
    const period_type = 'FY';

    const result = await pool.query(
      `INSERT INTO project_expenditure_entries (
        project_id,
        field_id,
        year_number,
        period_type,
        period_number,
        amount_spent,
        expenditure_date,
        remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [projectId, field_id, year_number, period_type, period_number, amount_spent, expenditure_date, remarks]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating expenditure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an expenditure entry
router.put('/projects/:projectId/expenditures/:expenditureId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId, expenditureId } = req.params;
  const {
    field_id,
    year_number,
    period_type,
    period_number,
    amount_spent,
    expenditure_date,
    remarks
  } = req.body;

  try {
    // Validate that the field is mapped to the project
    const fieldCheck = await pool.query(
      'SELECT 1 FROM project_budget_fields_mapping WHERE project_id = $1 AND field_id = $2',
      [projectId, field_id]
    );

    if (fieldCheck.rows.length === 0) {
      res.status(400).json({ error: 'Selected budget field is not mapped to this project' });
      return;
    }

    const result = await pool.query(
      `UPDATE project_expenditure_entries SET
        field_id = $1,
        year_number = $2,
        period_type = $3,
        period_number = $4,
        amount_spent = $5,
        expenditure_date = $6,
        remarks = $7
      WHERE expenditure_id = $8 AND project_id = $9 RETURNING *`,
      [field_id, year_number, period_type, period_number, amount_spent, expenditure_date, remarks, expenditureId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Expenditure entry not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating expenditure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an expenditure entry
router.delete('/projects/:projectId/expenditures/:expenditureId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { projectId, expenditureId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM project_expenditure_entries WHERE expenditure_id = $1 AND project_id = $2 RETURNING *',
      [expenditureId, projectId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Expenditure entry not found' });
      return;
    }

    res.json({ message: 'Expenditure entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Find the /expenditures/bulk endpoint and replace its logic with robust date handling and logging
router.post('/expenditures/bulk', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Received /finance/expenditures/bulk request');
  const client = await pool.connect();
  try {
    const { expenditures, originalDate } = req.body;
    console.log('Payload received:', { expenditures, originalDate });
    await client.query('BEGIN');

    // Validate expenditures array
    if (!Array.isArray(expenditures) || expenditures.length === 0) {
      throw new Error('Invalid expenditures data');
    }

    // Get unique project IDs and dates (both original and new)
    const projectIds = [...new Set(expenditures.map((e: any) => e.project_id))];
    const dates = new Set<string>();
    
    // Add the original date if provided
    if (originalDate) {
      dates.add(originalDate);
      console.log('Original date to delete:', originalDate);
    }
    
    // Add all new dates
    expenditures.forEach((e: any) => {
      const dateOnly = e.expenditure_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        throw new Error(`Invalid expenditure date format for entry. Expected yyyy-MM-dd, got: ${e.expenditure_date}`);
      }
      dates.add(dateOnly);
      console.log('New date to handle:', dateOnly);
    });

    console.log('Dates to process:', Array.from(dates));

    // Delete all existing entries for these project IDs and dates
    for (const projectId of projectIds) {
      for (const date of dates) {
        console.log(`Deleting entries for project ${projectId} and date ${date}`);
        const deleteResult = await client.query(
          'DELETE FROM project_expenditure_entries WHERE project_id = $1 AND expenditure_date = $2 RETURNING *',
          [projectId, date]
        );
        console.log(`Deleted ${deleteResult.rowCount} entries for project ${projectId} and date ${date}`);
      }
    }

    // Insert all expenditures
    const insertPromises = expenditures.map((entry: any) => {
      const {
        project_id,
        field_id,
        amount_spent,
        expenditure_date,
        remarks
      } = entry;

      console.log(`Inserting entry for project ${project_id}, field ${field_id}, date ${expenditure_date}`);

      // Calculate year and period based on the local date
      const date = new Date(expenditure_date);
      const year_number = date.getFullYear();
      const period_number = Math.floor((date.getMonth() + 3) / 3);
      const period_type = 'FY';

      return client.query(
        `INSERT INTO project_expenditure_entries (
          project_id,
          field_id,
          year_number,
          period_type,
          period_number,
          amount_spent,
          expenditure_date,
          remarks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          project_id,
          field_id,
          year_number,
          period_type,
          period_number,
          amount_spent,
          expenditure_date,
          remarks
        ]
      );
    });

    const results = await Promise.all(insertPromises);
    await client.query('COMMIT');
    
    console.log('Successfully processed all expenditures');
    res.status(201).json({
      message: 'Expenditures added successfully',
      entries: results.map((r: any) => r.rows[0])
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding expenditures:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to add expenditures' });
  } finally {
    client.release();
  }
});

// Add these new endpoints for grant received functionality
router.get('/projects/:projectId/budget-fields-with-grants', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get budget fields with their total budget and total grants received
    const query = `
      WITH budget_totals AS (
        SELECT 
          bf.field_id,
          bf.field_name,
          COALESCE(SUM(pbe.amount), 0) as total_budget
        FROM budget_fields bf
        LEFT JOIN project_budget_entries pbe ON bf.field_id = pbe.field_id 
        WHERE pbe.project_id = $1
        GROUP BY bf.field_id, bf.field_name
      ),
      grant_totals AS (
        SELECT 
          field_id,
          COALESCE(SUM(amount), 0) as total_grant_received
        FROM grant_received
        WHERE project_id = $1
        GROUP BY field_id
      )
      SELECT 
        bt.field_id,
        bt.field_name,
        bt.total_budget,
        COALESCE(gt.total_grant_received, 0) as total_grant_received
      FROM budget_totals bt
      LEFT JOIN grant_totals gt ON bt.field_id = gt.field_id
      ORDER BY bt.field_name;
    `;

    const result = await pool.query(query, [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching budget fields with grants:', error);
    res.status(500).json({ error: 'Failed to fetch budget fields with grants' });
  }
});

// Get grant entries for a project
router.get('/projects/:projectId/grant-entries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const query = `
      SELECT 
        gr.grant_id,
        gr.project_id,
        gr.field_id,
        bf.field_name,
        gr.received_date,
        gr.amount,
        gr.remarks,
        TO_CHAR(gr.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM grant_received gr
      JOIN budget_fields bf ON gr.field_id = bf.field_id
      WHERE gr.project_id = $1
      ORDER BY gr.received_date DESC, bf.field_name;
    `;
    
    const result = await pool.query(query, [projectId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching grant entries:', error);
    res.status(500).json({ error: 'Failed to fetch grant entries' });
  }
});

// Update grant entry
router.put('/grant-received/:grantId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { grantId } = req.params;
    const { amount, received_date, remarks } = req.body;

    // Validate input
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    if (!received_date || !Date.parse(received_date)) {
      res.status(400).json({ error: 'Invalid date' });
      return;
    }

    await client.query('BEGIN');

    // First get the current grant entry to check project_id and field_id
    const currentGrantQuery = `
      SELECT project_id, field_id 
      FROM grant_received 
      WHERE grant_id = $1
    `;
    const currentGrant = await client.query(currentGrantQuery, [grantId]);
    
    if (currentGrant.rows.length === 0) {
      res.status(404).json({ error: 'Grant entry not found' });
      return;
    }

    const { project_id, field_id } = currentGrant.rows[0];

    // Check if the new amount would exceed the budget
    const checkQuery = `
      WITH budget_info AS (
        SELECT 
          COALESCE(SUM(pbe.amount), 0) as total_budget,
          COALESCE(SUM(CASE WHEN gr.grant_id != $1 THEN gr.amount ELSE 0 END), 0) as other_grants
        FROM project_budget_entries pbe
        LEFT JOIN grant_received gr ON pbe.project_id = gr.project_id AND pbe.field_id = gr.field_id
        WHERE pbe.project_id = $2 AND pbe.field_id = $3
      )
      SELECT 
        total_budget,
        other_grants,
        CASE WHEN (other_grants + $4) > total_budget THEN true ELSE false END as exceeds_budget
      FROM budget_info;
    `;

    const checkResult = await client.query(checkQuery, [grantId, project_id, field_id, amount]);
    
    if (checkResult.rows[0].exceeds_budget) {
      res.status(400).json({ 
        error: 'Updated amount would exceed the budget for this field',
        details: {
          totalBudget: checkResult.rows[0].total_budget,
          otherGrants: checkResult.rows[0].other_grants,
          proposedAmount: amount,
          remaining: checkResult.rows[0].total_budget - checkResult.rows[0].other_grants
        }
      });
      return;
    }

    // Update the grant entry
    const updateQuery = `
      UPDATE grant_received 
      SET amount = $1, received_date = $2, remarks = $3
      WHERE grant_id = $4
      RETURNING *;
    `;

    const result = await client.query(updateQuery, [amount, received_date, remarks, grantId]);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating grant entry:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update grant entry' });
  } finally {
    client.release();
  }
});

// Delete grant entry
router.delete('/grant-received/:grantId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { grantId } = req.params;

    await client.query('BEGIN');

    // First check if the grant entry exists
    const checkQuery = 'SELECT 1 FROM grant_received WHERE grant_id = $1';
    const checkResult = await client.query(checkQuery, [grantId]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({ error: 'Grant entry not found' });
      return;
    }

    // Delete the grant entry
    await client.query('DELETE FROM grant_received WHERE grant_id = $1', [grantId]);

    await client.query('COMMIT');
    res.json({ message: 'Grant entry deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting grant entry:', error);
    res.status(500).json({ error: 'Failed to delete grant entry' });
  } finally {
    client.release();
  }
});

// Delete grant entries by project ID and date
router.delete('/grant-received/:projectId/:date', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { projectId, date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Invalid date format:', date);
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    console.log('=== Grant Delete Debug ===');
    console.log('Deleting grants for project:', projectId, 'date:', date);

    await client.query('BEGIN');

    // Delete all grant entries for this project and date
    const deleteResult = await client.query(
      'DELETE FROM grant_received WHERE project_id = $1 AND received_date = $2 RETURNING *',
      [projectId, date]
    );

    console.log('Deleted grants:', deleteResult.rowCount);

    if (deleteResult.rowCount === 0) {
      res.status(404).json({ error: 'No grant entries found for this date' });
      return;
    }

    await client.query('COMMIT');
    res.json({ message: 'Grant entries deleted successfully', count: deleteResult.rowCount });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting grant entries:', error);
    res.status(500).json({ error: 'Failed to delete grant entries' });
  } finally {
    client.release();
  }
});

// Get yearly tracking data for a project
router.get('/projects/:projectId/yearly-tracking', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get budget entries grouped by year
    const budgetQuery = await pool.query(
      `SELECT year_number, SUM(amount) as budget_amount
       FROM project_budget_entries
       WHERE project_id = $1
       GROUP BY year_number
       ORDER BY year_number`,
      [req.params.projectId]
    );

    // Get expenditures grouped by year
    const expenditureQuery = await pool.query(
      `SELECT year_number, SUM(amount_spent) as expenditure_amount
       FROM project_expenditure_entries
       WHERE project_id = $1
       GROUP BY year_number
       ORDER BY year_number`,
      [req.params.projectId]
    );

    // Get grants grouped by year
    const grantQuery = await pool.query(
      `SELECT year_number, SUM(amount) as grant_received
       FROM project_grant_received
       WHERE project_id = $1
       GROUP BY year_number
       ORDER BY year_number`,
      [req.params.projectId]
    );

    // Get project duration
    const projectQuery = await pool.query(
      'SELECT duration_years FROM projects WHERE project_id = $1',
      [req.params.projectId]
    );

    const duration = projectQuery.rows[0]?.duration_years || 0;

    // Combine all data
    const yearlyData = Array.from({ length: duration }, (_, i) => ({
      year_number: i,
      budget_amount: 0,
      expenditure_amount: 0,
      grant_received: 0
    }));

    // Fill in budget data
    budgetQuery.rows.forEach(row => {
      const index = parseInt(row.year_number);
      if (index < yearlyData.length) {
        yearlyData[index].budget_amount = parseFloat(row.budget_amount);
      }
    });

    // Fill in expenditure data
    expenditureQuery.rows.forEach(row => {
      const index = parseInt(row.year_number);
      if (index < yearlyData.length) {
        yearlyData[index].expenditure_amount = parseFloat(row.expenditure_amount);
      }
    });

    // Fill in grant data
    grantQuery.rows.forEach(row => {
      const index = parseInt(row.year_number);
      if (index < yearlyData.length) {
        yearlyData[index].grant_received = parseFloat(row.grant_received);
      }
    });

    res.json(yearlyData);
  } catch (error) {
    console.error('Error fetching yearly tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update grant entries by date
router.put('/grant-received/:date', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { date } = req.params;
    const { project_id, received_date, remarks, allocations } = req.body;

    console.log('=== Grant Update Debug ===');
    console.log('Request params:', { date });
    console.log('Request body:', {
      project_id,
      received_date,
      remarks,
      allocations: allocations.map((a: any) => ({
        field_id: a.field_id,
        amount: a.amount,
        amount_type: typeof a.amount,
        parsed_amount: Number(a.amount),
        is_valid: !isNaN(Number(a.amount)) && Number(a.amount) > 0
      }))
    });

    // Validate project_id
    if (!project_id || typeof project_id !== 'number') {
      console.error('Invalid project_id:', project_id);
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    // Validate allocations
    if (!Array.isArray(allocations) || allocations.length === 0) {
      console.error('Invalid allocations:', allocations);
      res.status(400).json({ error: 'Invalid allocations data' });
      return;
    }

    // Validate each allocation
    for (const allocation of allocations) {
      const amount = Number(allocation.amount);
      console.log(`Validating allocation:`, {
        field_id: allocation.field_id,
        original_amount: allocation.amount,
        parsed_amount: amount,
        isNaN: isNaN(amount),
        isNegative: amount < 0,
        isZero: amount === 0
      });

      if (isNaN(amount)) {
        console.error('Invalid amount (NaN):', allocation);
        res.status(400).json({ 
          error: 'Invalid amount',
          details: { 
            field_id: allocation.field_id,
            amount: allocation.amount,
            reason: 'Amount is not a valid number'
          }
        });
        return;
      }
      if (amount <= 0) {
        console.error('Invalid amount (non-positive):', allocation);
        res.status(400).json({ 
          error: 'Invalid amount',
          details: { 
            field_id: allocation.field_id,
            amount: allocation.amount,
            reason: 'Amount must be positive'
          }
        });
        return;
      }
    }

    await client.query('BEGIN');

    // Delete existing grant entries for this date
    console.log('Deleting existing grants for date:', date);
    const deleteResult = await client.query(
      'DELETE FROM grant_received WHERE project_id = $1 AND received_date = $2 RETURNING *',
      [project_id, date]
    );
    console.log('Deleted records:', deleteResult.rows);

    // Insert new grant entries
    for (const allocation of allocations) {
      const amount = Number(allocation.amount);
      if (amount > 0) {
        const insertQuery = `
          INSERT INTO grant_received (
            project_id, 
            field_id, 
            received_date, 
            amount, 
            remarks
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *;
        `;
        
        console.log('Inserting grant:', {
          project_id,
          field_id: allocation.field_id,
          received_date,
          amount,
          remarks
        });

        try {
          const insertResult = await client.query(insertQuery, [
            project_id,
            allocation.field_id,
            received_date,
            amount,
            remarks
          ]);
          console.log('Inserted record:', insertResult.rows[0]);
        } catch (error) {
          console.error('Error inserting grant:', {
            error,
            params: {
              project_id,
              field_id: allocation.field_id,
              received_date,
              amount,
              remarks
            }
          });
          throw error;
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Grant entries updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating grant entries:', error);
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('violates not-null constraint')) {
        res.status(400).json({ error: 'Invalid data: Required fields cannot be null' });
        return;
      }
      if (error.message.includes('violates check constraint')) {
        res.status(400).json({ error: 'Invalid amount: Amount must be positive' });
        return;
      }
      if (error.message.includes('violates foreign key constraint')) {
        res.status(400).json({ error: 'Invalid field_id or project_id' });
        return;
      }
    }
    
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update grant entries' });
  } finally {
    client.release();
  }
});

router.post('/grant-received', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { project_id, received_date, remarks, allocations } = req.body;

    // Validate input
    if (!project_id || !received_date || !Array.isArray(allocations)) {
      res.status(400).json({ error: 'Invalid input data' });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(received_date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    await client.query('BEGIN');

    // Insert grant entries for each field allocation - allow zero and negative values
    for (const allocation of allocations) {
      const amount = Number(allocation.amount);
      if (!isNaN(amount)) { // Only check if it's a valid number
        await client.query(
          `INSERT INTO grant_received (
            project_id, 
            field_id, 
            received_date, 
            amount, 
            remarks
          ) VALUES ($1, $2, $3, $4, $5)`,
          [project_id, allocation.field_id, received_date, amount, remarks]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Grant received entries added successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding grant received:', error);
    res.status(500).json({ error: 'Failed to add grant received entry' });
  } finally {
    client.release();
  }
});

router.post('/grant-received/bulk-edit', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    console.log('=== Grant Received Bulk Edit Debug ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { project_id, received_date, grants } = req.body;

    // Validate input
    if (!project_id || !received_date || !Array.isArray(grants)) {
      console.error('Invalid input:', { project_id, received_date, grants });
      res.status(400).json({ error: 'Invalid input data' });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(received_date)) {
      console.error('Invalid date format:', received_date);
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    console.log('Starting transaction...');
    await client.query('BEGIN');

    // Delete existing entries for this date
    console.log('Deleting existing entries...');
    const deleteResult = await client.query(
      `DELETE FROM grant_received 
       WHERE project_id = $1 AND received_date = $2`,
      [project_id, received_date]
    );
    console.log('Deleted grants:', deleteResult.rowCount);

    // Insert new entries - allow zero and negative values
    if (grants.length > 0) {
      console.log('Inserting new grant entries...');
      for (const grant of grants) {
        const amount = Number(grant.amount);
        if (!isNaN(amount)) { // Only check if it's a valid number
          console.log('Inserting grant:', { field_id: grant.field_id, amount });
          await client.query(
            `INSERT INTO grant_received (
              project_id, 
              field_id, 
              received_date, 
              amount, 
              remarks
            ) VALUES ($1, $2, $3, $4, $5)`,
            [project_id, grant.field_id, received_date, amount, grant.remarks || null]
          );
        }
      }
    }

    console.log('Committing transaction...');
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
    res.json({ message: 'Grant received entries updated successfully' });
  } catch (error) {
    console.error('Error in bulk-edit grant received:', error);
    await client.query('ROLLBACK');
    res.status(500).json({ 
      error: 'Failed to update grant received entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
});

export default router; 