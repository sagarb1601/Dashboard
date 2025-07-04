import express, { Request, Response } from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

interface PostgresError extends Error {
  code?: string;
}

// Get all equipment types
router.get('/equipments', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM admin_equipments ORDER BY equipment_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all AMC providers
router.get('/providers', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /providers - Fetching all providers');
    const result = await pool.query(
      'SELECT * FROM amc_providers ORDER BY amcprovider_name'
    );
    console.log('Providers fetched:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching providers:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new AMC provider
router.post('/providers', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('POST /providers - Adding new provider:', req.body);
  const {
    amcprovider_name,
    contact_person_name,
    contact_number,
    email,
    address
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO amc_providers 
       (amcprovider_name, contact_person_name, contact_number, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [amcprovider_name, contact_person_name, contact_number, email, address]
    );
    console.log('Provider added:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding provider:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update AMC provider
router.put('/providers/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  console.log(`PUT /providers/${id} - Updating provider:`, req.body);
  const {
    amcprovider_name,
    contact_person_name,
    contact_number,
    email,
    address
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE amc_providers 
       SET amcprovider_name = $1,
           contact_person_name = $2,
           contact_number = $3,
           email = $4,
           address = $5
       WHERE amcprovider_id = $6
       RETURNING *`,
      [amcprovider_name, contact_person_name, contact_number, email, address, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    console.log('Provider updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating provider:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete AMC provider
router.delete('/providers/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  console.log(`DELETE /providers/${id} - Deleting provider`);

  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Check if provider has any mappings
    const mappingsCheck = await client.query(
      'SELECT COUNT(*) FROM amc_contracts WHERE amcprovider_id = $1',
      [id]
    );

    if (parseInt(mappingsCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ 
        message: 'Cannot delete provider because it has existing mappings (active or inactive)' 
      });
      return;
    }

    // If no mappings exist, proceed with deletion
    const result = await client.query(
      'DELETE FROM amc_providers WHERE amcprovider_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    await client.query('COMMIT');
    console.log('Provider deleted:', result.rows[0]);
    res.json({ message: 'Provider deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting provider:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// Get all AMC contracts with provider and equipment details
router.get('/contracts', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
              e.equipment_name,
              p.amcprovider_name,
              CASE 
                WHEN c.end_date < CURRENT_DATE THEN 'INACTIVE'
                ELSE 'ACTIVE'
              END as status
       FROM amc_contracts c
       JOIN admin_equipments e ON c.equipment_id = e.equipment_id
       JOIN amc_providers p ON c.amcprovider_id = p.amcprovider_id
       ORDER BY c.end_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new AMC contract
router.post('/contracts', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('\n=== POST /contracts - Creating new AMC contract ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const {
    equipment_id,
    amcprovider_id,
    start_date,
    end_date,
    amc_value,
    remarks
  } = req.body;

  // Validate required fields
  if (!equipment_id || !amcprovider_id || !start_date || !end_date || !amc_value) {
    console.error('Missing required fields:', { equipment_id, amcprovider_id, start_date, end_date, amc_value });
    res.status(400).json({ 
      message: 'Missing required fields',
      details: {
        equipment_id: !equipment_id,
        amcprovider_id: !amcprovider_id,
        start_date: !start_date,
        end_date: !end_date,
        amc_value: !amc_value
      }
    });
    return;
  }

  // Validate data types
  if (isNaN(Number(equipment_id)) || isNaN(Number(amcprovider_id)) || isNaN(Number(amc_value))) {
    console.error('Invalid data types:', { equipment_id, amcprovider_id, amc_value });
    res.status(400).json({ 
      message: 'Invalid data types',
      details: {
        equipment_id: typeof equipment_id,
        amcprovider_id: typeof amcprovider_id,
        amc_value: typeof amc_value
      }
    });
    return;
  }

  const client = await pool.connect();
  try {
    console.log('Starting transaction...');
    await client.query('BEGIN');

    // Check for existing active mappings for this equipment
    console.log('Checking for existing active mappings...');
    const activeMappingCheck = await client.query(
      `SELECT COUNT(*) FROM amc_contracts 
       WHERE equipment_id = $1 
       AND end_date >= CURRENT_DATE`,
      [equipment_id]
    );

    console.log('Active mappings count:', activeMappingCheck.rows[0].count);

    if (parseInt(activeMappingCheck.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      console.log('Found existing active mapping, rolling back...');
      res.status(400).json({ 
        message: 'Cannot add new mapping because this equipment already has an active contract' 
      });
      return;
    }

    // If no active mappings exist, proceed with creation
    console.log('Creating new contract with values:', {
      equipment_id,
      amcprovider_id,
      start_date,
      end_date,
      amc_value,
      remarks
    });

    const result = await client.query(
      `INSERT INTO amc_contracts 
       (equipment_id, amcprovider_id, start_date, end_date, amc_value, remarks)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [equipment_id, amcprovider_id, start_date, end_date, amc_value, remarks]
    );

    await client.query('COMMIT');
    console.log('Contract created successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    const pgError = err as PostgresError;
    console.error('Error creating contract:', {
      error: err,
      code: pgError.code,
      message: pgError.message,
      detail: (pgError as any).detail,
      constraint: (pgError as any).constraint
    });
    
    let errorMessage = 'Server error';
    let errorDetails = pgError.message;

    if (pgError.code === '23514') {
      errorMessage = 'Invalid date range or AMC value';
    } else if (pgError.code === '23503') {
      errorMessage = 'Invalid equipment or provider ID';
    } else if (pgError.code === '23505') {
      errorMessage = 'Duplicate entry';
    } else if (pgError.code === '22P02') {
      errorMessage = 'Invalid input syntax';
    }

    res.status(500).json({ 
      message: errorMessage,
      details: errorDetails
    });
  } finally {
    client.release();
  }
});

// Update AMC contract
router.put('/contracts/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const {
    equipment_id,
    amcprovider_id,
    start_date,
    end_date,
    amc_value,
    remarks
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE amc_contracts 
       SET equipment_id = $1,
           amcprovider_id = $2,
           start_date = $3,
           end_date = $4,
           amc_value = $5,
           remarks = $6,
           status = CASE 
             WHEN $4 < CURRENT_DATE THEN 'INACTIVE'
             ELSE 'ACTIVE'
           END
       WHERE amccontract_id = $7
       RETURNING *`,
      [equipment_id, amcprovider_id, start_date, end_date, amc_value, remarks, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    const pgError = err as PostgresError;
    console.error(err);
    if (pgError.code === '23514') {
      res.status(400).json({ message: 'Invalid date range or AMC value' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Add this new endpoint to list all contracts with their IDs
router.get('/contracts/test', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('\n=== TEST: Listing All Contracts ===');
    const result = await pool.query(
      `SELECT amccontract_id, equipment_id, amcprovider_id, start_date, end_date 
       FROM amc_contracts 
       ORDER BY amccontract_id`
    );
    console.log('Available contracts:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error in test endpoint:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

async function safeDeleteContract(
  client: any,
  contractId: number
): Promise<any> {
  try {
    console.log('\n=== Starting safe delete operation ===');
    console.log('Attempting to delete contract ID:', contractId);

    // Start a transaction
    await client.query('BEGIN');
    console.log('Transaction started');

    // First check if contract exists
    const checkResult = await client.query(
      'SELECT * FROM amc_contracts WHERE amccontract_id = $1',
      [contractId]
    );
    console.log('Contract check result:', checkResult.rows[0]);

    if (!checkResult.rows[0]) {
      console.log('Contract not found');
      await client.query('ROLLBACK');
      return null;
    }

    // First set foreign key references to NULL
    console.log('Setting foreign key references to NULL');
    const updateResult = await client.query(
      'UPDATE amc_contracts SET equipment_id = NULL, amcprovider_id = NULL WHERE amccontract_id = $1 RETURNING *',
      [contractId]
    );
    console.log('Update result:', updateResult.rows[0]);

    // Then delete the contract
    console.log('Deleting contract');
    const deleteResult = await client.query(
      'DELETE FROM amc_contracts WHERE amccontract_id = $1 RETURNING *',
      [contractId]
    );
    console.log('Delete result:', deleteResult.rows[0]);

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Transaction committed');

    return deleteResult.rows[0];
  } catch (error: any) {
    // Rollback in case of error
    console.error('Error in safe delete operation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      constraint: error.constraint
    });
    await client.query('ROLLBACK');
    console.log('Transaction rolled back');
    throw error;
  }
}

// Modify the delete endpoint with more logging
router.delete('/contracts/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  console.log('\n=== DELETE CONTRACT REQUEST ===');
  console.log('Request params:', req.params);
  
  try {
    const contractId = parseInt(req.params.id);
    console.log('Attempting to delete contract ID:', contractId);
    
    // Start transaction
    await client.query('BEGIN');
    
    // First verify the contract exists
    const verifyResult = await client.query(
      'SELECT * FROM amc_contracts WHERE amccontract_id = $1',
      [contractId]
    );
    
    if (!verifyResult.rows[0]) {
      console.log(`Contract ${contractId} not found`);
      await client.query('ROLLBACK');
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    // Set foreign key references to NULL first
    await client.query(
      'UPDATE amc_contracts SET equipment_id = NULL, amcprovider_id = NULL WHERE amccontract_id = $1',
      [contractId]
    );

    // Then delete the contract
    const deleteResult = await client.query(
      'DELETE FROM amc_contracts WHERE amccontract_id = $1 RETURNING *',
      [contractId]
    );

    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully deleted contract');
    res.json({ 
      message: 'Contract deleted successfully',
      deletedId: contractId
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in delete endpoint:', error);
    res.status(500).json({ 
      message: 'Error deleting contract',
      error: error.message
    });
  } finally {
    client.release();
  }
});

export default router; 