import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import pool from '../../db';

interface Staff {
  staff_id: number;
  name: string;
  department_id: number;
  department_name: string;
  joining_date: string;
  date_of_leaving: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface Salary {
  salary_id: number;
  staff_id: number;
  net_salary: number;
  payment_date: string;
  status: 'PAID' | 'PENDING';
}

interface ErrorResponse {
  error: string;
}

const router = Router();

// Get all staff with department names
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/staff - Fetching all staff');

    // First check if the tables exist
    const checkTables = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_staff'
      ) as staff_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_departments'
      ) as departments_exists
    `);

    const { staff_exists, departments_exists } = checkTables.rows[0];
    
    if (!staff_exists || !departments_exists) {
      console.error('Missing required tables:', { staff_exists, departments_exists });
      res.status(500).json({ error: 'Database tables not properly set up' });
      return;
    }

    // Get all staff with department names and additional details
    const result = await pool.query(`
      SELECT 
        s.staff_id,
        s.name,
        s.department_id,
        s.joining_date,
        s.date_of_leaving,
        s.status,
        s.gender,
        d.department_name,
        COALESCE(
          (SELECT MAX(payment_date) 
           FROM admin_staff_salaries 
           WHERE staff_id = s.staff_id),
          NULL
        ) as last_salary_date,
        COALESCE(
          (SELECT net_salary 
           FROM admin_staff_salaries 
           WHERE staff_id = s.staff_id 
           ORDER BY payment_date DESC 
           LIMIT 1),
          0
        ) as current_salary
      FROM admin_staff s
      JOIN admin_departments d ON s.department_id = d.department_id
      ORDER BY s.name
    `);

    console.log('Staff query result:', result.rows.length, 'staff members found');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Add new staff member
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { name, department_id, joining_date, date_of_leaving, status, gender } = req.body;
  console.log('POST /admin/staff - Adding new staff member:', { name, department_id, joining_date, status, gender });
  
  try {
    // First check if staff with same name exists in the department
    const existingStaff = await pool.query(
      `SELECT COUNT(*) as count 
       FROM admin_staff 
       WHERE TRIM(LOWER(name)) = TRIM(LOWER($1)) 
       AND department_id = $2 
       AND status = 'ACTIVE'`,
      [name, department_id]
    );

    if (parseInt(existingStaff.rows[0].count) > 0) {
      console.log('Staff with same name already exists in department');
      res.status(400).json({ 
        error: 'An active staff member with this name already exists in the selected department' 
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO admin_staff 
       (name, department_id, joining_date, date_of_leaving, status, gender) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name.trim(), department_id, joining_date, date_of_leaving, status, gender]
    );

    // Get department name
    const staffWithDept = await pool.query(`
      SELECT s.*, d.department_name 
      FROM admin_staff s
      JOIN admin_departments d ON s.department_id = d.department_id
      WHERE s.staff_id = $1
    `, [result.rows[0].staff_id]);

    console.log('New staff member added:', staffWithDept.rows[0]);
    res.status(201).json(staffWithDept.rows[0]);
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ error: 'Failed to add staff member. Please try again.' });
  }
});

// Update staff member
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, department_id, joining_date, date_of_leaving, status, gender } = req.body;
  
  try {
    // If name or department is being updated, check for duplicates
    if (name || department_id) {
      const existingStaff = await pool.query(
        `SELECT COUNT(*) as count 
         FROM admin_staff 
         WHERE TRIM(LOWER(name)) = TRIM(LOWER($1)) 
         AND department_id = $2 
         AND staff_id != $3 
         AND status = 'ACTIVE'`,
        [name, department_id, id]
      );

      if (parseInt(existingStaff.rows[0].count) > 0) {
        res.status(400).json({ 
          error: 'Another active staff member with this name already exists in the selected department' 
        });
        return;
      }
    }

    const result = await pool.query(
      `UPDATE admin_staff 
       SET name = COALESCE(TRIM($1), name),
           department_id = COALESCE($2, department_id),
           joining_date = COALESCE($3, joining_date),
           date_of_leaving = $4,
           status = COALESCE($5, status),
           gender = COALESCE($6, gender)
       WHERE staff_id = $7 
       RETURNING *`,
      [name, department_id, joining_date, date_of_leaving, status, gender, id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    // Get department name
    const staffWithDept = await pool.query(`
      SELECT s.*, d.department_name 
      FROM admin_staff s
      JOIN admin_departments d ON s.department_id = d.department_id
      WHERE s.staff_id = $1
    `, [id]);
    
    res.json(staffWithDept.rows[0]);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ error: 'Failed to update staff member. Please try again.' });
  }
});

// Delete staff member
router.delete('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    // First check for salary records
    const salaryResult = await pool.query(`
      SELECT COUNT(*) 
      FROM admin_staff_salaries 
      WHERE staff_id = $1
    `, [id]);
    
    if (parseInt(salaryResult.rows[0].count) > 0) {
      res.status(400).json({ 
        error: 'Cannot delete staff member with salary records. Please delete all salary records first.' 
      });
      return;
    }

    // If no salary records, proceed with deletion
    const result = await pool.query(
      'DELETE FROM admin_staff WHERE staff_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }
    
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
});

// Get all salaries
router.get('/salaries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /admin/staff/salaries - Fetching all salaries');
    const result = await pool.query('SELECT * FROM admin_staff_salaries ORDER BY payment_date DESC');
    console.log('Salaries query result:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching salaries:', error);
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
});

// Add new salary record
router.post('/salaries', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { staff_id, net_salary, payment_date, status } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO admin_staff_salaries 
       (staff_id, net_salary, payment_date, status) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [staff_id, net_salary, payment_date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding salary:', error);
    res.status(500).json({ error: 'Failed to add salary record' });
  }
});

// Update salary record
router.put('/salaries/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { net_salary, payment_date, status } = req.body;
  
  try {
    let updateFields = [];
    let params = [];
    let paramCount = 1;

    if (net_salary !== undefined) {
      updateFields.push(`net_salary = $${paramCount}`);
      params.push(net_salary);
      paramCount++;
    }
    if (payment_date !== undefined) {
      updateFields.push(`payment_date = $${paramCount}`);
      params.push(payment_date);
      paramCount++;
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    params.push(id);
    const query = `
      UPDATE admin_staff_salaries 
      SET ${updateFields.join(', ')}
      WHERE salary_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Salary record not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating salary:', error);
    res.status(500).json({ error: 'Failed to update salary record' });
  }
});

// Delete salary record
router.delete('/salaries/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM admin_staff_salaries WHERE salary_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Salary record not found' });
      return;
    }
    
    res.json({ message: 'Salary record deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({ error: 'Failed to delete salary record' });
  }
});

// Get salaries by staff ID
router.get('/salaries/staff/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM admin_staff_salaries WHERE staff_id = $1 ORDER BY payment_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff salaries:', error);
    res.status(500).json({ error: 'Failed to fetch staff salaries' });
  }
});

export default router; 