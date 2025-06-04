import express, { Request, Response } from 'express';
import pool from '../../db';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// Get all vehicles
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM transport_vehicles ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new vehicle
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { company_name, model, registration_no } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transport_vehicles (company_name, model, registration_no)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [company_name, model, registration_no]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error adding vehicle:', err);
    if (err.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Registration number already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update vehicle
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { company_name, model, registration_no } = req.body;
  const vehicle_id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `UPDATE transport_vehicles 
       SET company_name = $1, model = $2, registration_no = $3
       WHERE vehicle_id = $4
       RETURNING *`,
      [company_name, model, registration_no, vehicle_id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating vehicle:', err);
    if (err.code === '23505') {
      res.status(400).json({ message: 'Registration number already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const vehicle_id = parseInt(req.params.id);
  try {
    // Check for existing insurance records
    const insuranceCheck = await pool.query(
      'SELECT COUNT(*) FROM vehicle_insurance WHERE vehicle_id = $1',
      [vehicle_id]
    );
    
    // Check for existing servicing records
    const servicingCheck = await pool.query(
      'SELECT COUNT(*) FROM vehicle_servicing WHERE vehicle_id = $1',
      [vehicle_id]
    );

    if (parseInt(insuranceCheck.rows[0].count) > 0 || parseInt(servicingCheck.rows[0].count) > 0) {
      res.status(400).json({ 
        message: 'Cannot delete vehicle. Please delete all insurance and servicing records first.' 
      });
      return;
    }

    const result = await pool.query(
      'DELETE FROM transport_vehicles WHERE vehicle_id = $1 RETURNING *',
      [vehicle_id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all servicing records for a vehicle
router.get('/:id/servicing', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const vehicle_id = parseInt(req.params.id);
  try {
    const result = await pool.query(
      `SELECT s.*, v.registration_no 
       FROM vehicle_servicing s
       JOIN transport_vehicles v ON s.vehicle_id = v.vehicle_id
       WHERE s.vehicle_id = $1
       ORDER BY s.service_date DESC`,
      [vehicle_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching servicing records:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add servicing record
router.post('/servicing', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { vehicle_id, service_date, next_service_date, service_description, servicing_amount } = req.body;
  try {
    // Check for overlapping service dates for the same vehicle
    const overlapCheck = await pool.query(
      `SELECT * FROM vehicle_servicing 
       WHERE vehicle_id = $1 
       AND (
         (service_date <= $2 AND next_service_date >= $2) OR
         (service_date <= $3 AND next_service_date >= $3) OR
         (service_date >= $2 AND next_service_date <= $3)
       )`,
      [vehicle_id, service_date, next_service_date]
    );

    if (overlapCheck.rows.length > 0) {
      res.status(400).json({ 
        message: 'This vehicle already has a servicing record for the specified time period. Please choose different dates.' 
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO vehicle_servicing 
       (vehicle_id, service_date, next_service_date, service_description, servicing_amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vehicle_id, service_date, next_service_date, service_description, servicing_amount]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding servicing record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete servicing record
router.delete('/servicing/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'DELETE FROM vehicle_servicing WHERE service_id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Servicing record not found' });
      return;
    }
    
    res.json({ message: 'Servicing record deleted successfully' });
  } catch (err) {
    console.error('Error deleting servicing record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update servicing record
router.put('/servicing/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { service_date, next_service_date, service_description, servicing_amount } = req.body;
  try {
    // Check for overlapping service dates for the same vehicle, excluding current record
    const overlapCheck = await pool.query(
      `SELECT * FROM vehicle_servicing 
       WHERE service_id != $1
       AND vehicle_id = (SELECT vehicle_id FROM vehicle_servicing WHERE service_id = $1)
       AND (
         (service_date <= $2 AND next_service_date >= $2) OR
         (service_date <= $3 AND next_service_date >= $3) OR
         (service_date >= $2 AND next_service_date <= $3)
       )`,
      [req.params.id, service_date, next_service_date]
    );

    if (overlapCheck.rows.length > 0) {
      res.status(400).json({ 
        message: 'This vehicle already has a servicing record for the specified time period. Please choose different dates.' 
      });
      return;
    }

    const result = await pool.query(
      `UPDATE vehicle_servicing 
       SET service_date = $1, next_service_date = $2, 
           service_description = $3, servicing_amount = $4
       WHERE service_id = $5
       RETURNING *`,
      [service_date, next_service_date, service_description, servicing_amount, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Servicing record not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating servicing record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all insurance records for a vehicle
router.get('/:id/insurance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const vehicle_id = parseInt(req.params.id);
  console.log('Fetching insurance records for vehicle:', vehicle_id);
  try {
    const result = await pool.query(
      `SELECT i.*, v.registration_no 
       FROM vehicle_insurance i
       JOIN transport_vehicles v ON i.vehicle_id = v.vehicle_id
       WHERE i.vehicle_id = $1
       ORDER BY i.insurance_start_date DESC`,
      [vehicle_id]
    );
    console.log('Insurance records found:', result.rows.length);
    console.log('Insurance records:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching insurance records:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add insurance record
router.post('/insurance', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicle_insurance 
       (vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vehicle_id, insurance_provider, policy_number, insurance_start_date, insurance_end_date]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error adding insurance record:', err);
    
    // Handle specific database errors
    if (err.code === '23505' && err.constraint === 'vehicle_insurance_policy_number_key') {
      res.status(400).json({ 
        detail: 'policy_number_key',
        message: 'This policy number already exists. Please enter a unique policy number.' 
      });
    } else if (err.code === '23514' && err.constraint === 'insurance_dates_check') {
      res.status(400).json({ 
        detail: 'insurance_dates_check',
        message: 'Insurance end date must be after start date.' 
      });
    } else if (err.code === '23P01' && err.constraint === 'no_insurance_overlap') {
      res.status(400).json({ 
        detail: 'no_insurance_overlap',
        message: 'This vehicle already has insurance coverage for the specified time period. Please choose different dates.' 
      });
    } else {
      res.status(500).json({ 
        detail: err.detail || 'Unknown error',
        message: 'Server error while adding insurance record.' 
      });
    }
  }
});

// Delete insurance record
router.delete('/insurance/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'DELETE FROM vehicle_insurance WHERE insurance_id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Insurance record not found' });
      return;
    }
    
    res.json({ message: 'Insurance record deleted successfully' });
  } catch (err) {
    console.error('Error deleting insurance record:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update insurance record
router.put('/insurance/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { insurance_provider, policy_number, insurance_start_date, insurance_end_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicle_insurance 
       SET insurance_provider = $1, policy_number = $2, 
           insurance_start_date = $3, insurance_end_date = $4
       WHERE insurance_id = $5
       RETURNING *`,
      [insurance_provider, policy_number, insurance_start_date, insurance_end_date, req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Insurance record not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('Error updating insurance record:', err);
    
    // Handle specific database errors
    if (err.code === '23505' && err.constraint === 'policy_number_unique') {
      res.status(400).json({ 
        message: 'This policy number already exists. Please enter a unique policy number.' 
      });
    } else if (err.code === '23514' && err.constraint === 'insurance_dates_check') {
      res.status(400).json({ 
        message: 'Insurance end date must be after start date.' 
      });
    } else if (err.code === '23P01' && err.constraint === 'no_insurance_overlap') {
      res.status(400).json({ 
        message: 'This vehicle already has insurance coverage for the specified time period. Please choose different dates.' 
      });
    } else {
      res.status(500).json({ message: 'Server error while updating insurance record.' });
    }
  }
});

export default router; 