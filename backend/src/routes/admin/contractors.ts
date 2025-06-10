import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import pool from '../../db';


interface Contractor {
  contractor_id: number;
  contractor_company_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  address?: string;
}

interface ContractorMapping {
  contract_id: number;
  contractor_id: number;
  department_id: number;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'INACTIVE' | 'UPCOMING';
}

interface ErrorResponse {
  error: string;
}

const router = Router();

// Get all contractors
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/contractors - Fetching all contractors');
    const result = await pool.query('SELECT * FROM admin_contractors ORDER BY contractor_company_name');
    console.log('Contractors query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    res.status(500).json({ error: 'Failed to fetch contractors' });
  }
});

// Add new contractor
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { contractor_company_name, contact_person, phone, email, address } = req.body;
  console.log('POST /admin/contractors - Adding new contractor:', { contractor_company_name, contact_person });
  
  try {
    const result = await pool.query(
      `INSERT INTO admin_contractors 
       (contractor_company_name, contact_person, phone, email, address) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [contractor_company_name, contact_person, phone, email, address]
    );
    console.log('New contractor added:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding contractor:', error);
    res.status(500).json({ error: 'Failed to add contractor' });
  }
});

// Update contractor
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { contractor_company_name, contact_person, phone, email, address } = req.body;
  console.log(`PUT /admin/contractors/${id} - Updating contractor:`, { contractor_company_name, contact_person });
  
  try {
    const result = await pool.query(
      `UPDATE admin_contractors 
       SET contractor_company_name = COALESCE($1, contractor_company_name),
           contact_person = COALESCE($2, contact_person),
           phone = COALESCE($3, phone),
           email = $4,
           address = $5
       WHERE contractor_id = $6 
       RETURNING *`,
      [contractor_company_name, contact_person, phone, email, address, id]
    );
    
    if (result.rows.length === 0) {
      console.log('Contractor not found:', id);
      res.status(404).json({ error: 'Contractor not found' });
      return;
    }
    
    console.log('Contractor updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contractor:', error);
    res.status(500).json({ error: 'Failed to update contractor' });
  }
});

// Delete contractor
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  console.log(`DELETE /admin/contractors/${id} - Deleting contractor`);
  
  try {
    const mappingCheck = await pool.query(
      'SELECT * FROM admin_contractor_department_mapping WHERE contractor_id = $1 LIMIT 1',
      [id]
    );

    if(mappingCheck.rows.length > 0){
      res.status(404).json({error: "Contractor is mapped with any department."});
      return;
    }

    const result = await pool.query(
      'DELETE FROM admin_contractors WHERE contractor_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log('Contractor not found:', id);
      res.status(404).json({ error: 'Contractor not found' });
      return;
    }
    
    console.log('Contractor deleted:', result.rows[0]);
    res.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    console.error('Error deleting contractor:', error);
    res.status(500).json({ error: 'Failed to delete contractor' });
  }
});

// Get contractor mappings
router.get('/mappings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/contractors/mappings - Fetching contractor mappings');
    
    // First check if the tables exist
    const checkTables = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_contractor_department_mapping'
      ) as mapping_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_contractors'
      ) as contractors_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_departments'
      ) as departments_exists
    `);

    const { mapping_exists, contractors_exists, departments_exists } = checkTables.rows[0];
    
    if (!mapping_exists || !contractors_exists || !departments_exists) {
      console.error('Missing required tables:', { mapping_exists, contractors_exists, departments_exists });
      res.status(500).json({ error: 'Database tables not properly set up' });
      return;
    }

    // Get all mappings with detailed information
    const result = await pool.query(`
      SELECT 
        m.contract_id,
        m.contractor_id,
        m.department_id,
        m.start_date,
        m.end_date,
        c.contractor_company_name,
        c.contact_person,
        c.phone,
        d.department_name,
        CASE 
          WHEN CURRENT_DATE < m.start_date THEN 'UPCOMING'
          WHEN CURRENT_DATE > m.end_date THEN 'INACTIVE'
          ELSE 'ACTIVE'
        END as status
      FROM admin_contractor_department_mapping m
      JOIN admin_contractors c ON m.contractor_id = c.contractor_id
      JOIN admin_departments d ON m.department_id = d.department_id
      ORDER BY 
        CASE 
          WHEN CURRENT_DATE < m.start_date THEN 1
          WHEN CURRENT_DATE BETWEEN m.start_date AND m.end_date THEN 0
          ELSE 2
        END,
        m.start_date DESC
    `);

    console.log('Contractor mappings found:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contractor mappings:', error);
    res.status(500).json({ error: 'Failed to fetch contractor mappings' });
  }
});

// Add contractor mapping
router.post('/mappings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { contractor_id, department_id, start_date, end_date } = req.body;
  console.log('POST /admin/contractors/mappings - Adding new mapping:', { contractor_id, department_id, start_date, end_date });
  
  try {
    const result = await pool.query(
      `INSERT INTO admin_contractor_department_mapping 
       (contractor_id, department_id, start_date, end_date) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [contractor_id, department_id, start_date, end_date]
    );
    console.log('New contractor mapping added:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error: unknown) {
    let errorMessage = 'Internal Server Error';

    if (error instanceof Error) {
      // This gets only the main message, stripping the stack trace
      errorMessage = error.message.split('\n')[0];
    }

    console.error('Error adding contractor mapping:', errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// Update contractor mapping
router.put('/mappings/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { contractor_id, department_id, start_date, end_date } = req.body;
  console.log(`PUT /admin/contractors/mappings/${id} - Updating mapping:`, { contractor_id, department_id, start_date, end_date });

  try {
    const result = await pool.query(
      `UPDATE admin_contractor_department_mapping
       SET contractor_id = COALESCE($1, contractor_id),
           department_id = COALESCE($2, department_id),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date)
       WHERE contract_id = $5
       RETURNING *`,
      [contractor_id, department_id, start_date, end_date, id]
    );

    if (result.rows.length === 0) {
      console.log('Mapping not found:', id);
      res.status(404).json({ error: 'Mapping not found' });
      return;
    }

    console.log('Mapping updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating contractor mapping:', error);
    res.status(500).json({ error: 'Failed to update contractor mapping' });
  }
});


// Delete contractor mapping
router.delete('/mappings/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  console.log(`DELETE /admin/contractors/mappings/${id} - Deleting mapping`);
  
  try {
    const result = await pool.query(
      'DELETE FROM admin_contractor_department_mapping WHERE contract_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      console.log('Contractor mapping not found:', id);
      res.status(404).json({ error: 'Contractor mapping not found' });
      return;
    }
    
    console.log('Contractor mapping deleted:', result.rows[0]);
    res.json({ message: 'Contractor mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting contractor mapping:', error);
    res.status(500).json({ error: 'Failed to delete contractor mapping' });
  }
});

// Get single contractor
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM admin_contractors WHERE contractor_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Contractor not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contractor:', error);
    res.status(500).json({ error: 'Failed to fetch contractor' });
  }
});

export default router; 