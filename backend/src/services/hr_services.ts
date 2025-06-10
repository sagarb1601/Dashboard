import { db } from '../db';
import { Request, Response } from 'express';
import pool from '../db';

// Add new employee with initial designation and group
export const addEmployee = async (req: Request, res: Response) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            employee_id,
            employee_name,
            designation_id,
            technical_group_id,
            join_date,
            level,
            remarks
        } = req.body;

        // Insert employee
        const employeeResult = await client.query(
            `INSERT INTO hr_employees 
            (employee_id, employee_name, designation_id, technical_group_id, join_date) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [employee_id, employee_name, designation_id, technical_group_id, join_date]
        );

        // Add initial designation as first promotion
        await client.query(
            `INSERT INTO hr_employee_promotions 
            (employee_id, designation_id, effective_from_date, level, remarks) 
            VALUES ($1, $2, $3, $4, $5)`,
            [employee_id, designation_id, join_date, level, remarks]
        );

        // Add initial group assignment with NULL as from_group_id since it's first assignment
        await client.query(
            `INSERT INTO hr_employee_group_changes 
            (employee_id, from_group_id, to_group_id, effective_from_date, remarks) 
            VALUES ($1, NULL, $2, $3, $4)`,
            [employee_id, technical_group_id, join_date, remarks]
        );

        await client.query('COMMIT');
        res.status(201).json(employeeResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in addEmployee:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Add promotion
export const addPromotion = async (req: Request, res: Response) => {
    const client = await db.connect();
    try {
        const {
            employee_id,
            designation_id,
            effective_from_date,
            level,
            remarks
        } = req.body;

        // Verify employee exists and is active
        const employeeCheck = await client.query(
            'SELECT status FROM hr_employees WHERE employee_id = $1',
            [employee_id]
        );

        if (employeeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employeeCheck.rows[0].status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Cannot promote inactive employee' });
        }

        // Add promotion
        const result = await client.query(
            `INSERT INTO hr_employee_promotions 
            (employee_id, designation_id, effective_from_date, level, remarks) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [employee_id, designation_id, effective_from_date, level, remarks]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error in addPromotion:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Change technical group
export const changeGroup = async (req: Request, res: Response) => {
    const client = await db.connect();
    try {
        const {
            employee_id,
            to_group_id,
            effective_from_date,
            remarks
        } = req.body;

        // Verify employee exists and is active
        const employeeCheck = await client.query(
            'SELECT status, technical_group_id FROM hr_employees WHERE employee_id = $1',
            [employee_id]
        );

        if (employeeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employeeCheck.rows[0].status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Cannot change group for inactive employee' });
        }

        const currentGroupId = employeeCheck.rows[0].technical_group_id;

        if (currentGroupId === to_group_id) {
            return res.status(400).json({ error: 'Employee is already in this group' });
        }

        // Add group change with current group as from_group_id
        const result = await client.query(
            `INSERT INTO hr_employee_group_changes 
            (employee_id, from_group_id, to_group_id, effective_from_date, remarks) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [employee_id, currentGroupId, to_group_id, effective_from_date, remarks]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error in changeGroup:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

// Record attrition
export const recordAttrition = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const {
            employee_id,
            reason_for_leaving,
            reason_details,
            last_date,
            year,
            month
        } = req.body;

        // Verify employee exists and is active
        const employeeCheck = await client.query(
            'SELECT status FROM hr_employees WHERE employee_id = $1',
            [employee_id]
        );

        if (employeeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (employeeCheck.rows[0].status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Employee is already inactive' });
        }

        // Record attrition
        const result = await client.query(
            `INSERT INTO hr_attrition 
            (employee_id, reason_for_leaving, reason_details, last_date, year, month) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [employee_id, reason_for_leaving, reason_details, last_date, year, month]
        );

        // Update employee status
        await client.query(
            `UPDATE hr_employees 
             SET status = $1, 
                 leaving_date = $2 
             WHERE employee_id = $3`,
            [reason_for_leaving, last_date, employee_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: unknown) {
        console.error('Error in recordAttrition:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
        client.release();
    }
};

// Get employee history (promotions, group changes, and attrition)
export const getEmployeeHistory = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const { employee_id } = req.params;

        // Get employee details
        const employeeResult = await client.query(
            `SELECT e.*, 
                    d.designation as current_designation,
                    tg.group_name as current_group
             FROM hr_employees e
             LEFT JOIN hr_designations d ON e.designation_id = d.designation_id
             LEFT JOIN hr_technical_groups tg ON e.technical_group_id = tg.technical_group_id
             WHERE e.employee_id = $1`,
            [employee_id]
        );

        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Get promotion history
        const promotionsResult = await client.query(
            `SELECT p.*, d.designation
             FROM hr_employee_promotions p
             JOIN hr_designations d ON p.designation_id = d.designation_id
             WHERE p.employee_id = $1
             ORDER BY p.effective_from_date`,
            [employee_id]
        );

        // Get group change history with from and to group names
        const groupChangesResult = await client.query(
            `SELECT g.*,
                    fg.group_name as from_group,
                    tg.group_name as to_group
             FROM hr_employee_group_changes g
             LEFT JOIN hr_technical_groups fg ON g.from_group_id = fg.technical_group_id
             JOIN hr_technical_groups tg ON g.to_group_id = tg.technical_group_id
             WHERE g.employee_id = $1
             ORDER BY g.effective_from_date`,
            [employee_id]
        );

        // Get attrition record if exists
        const attritionResult = await client.query(
            `SELECT * FROM hr_attrition
             WHERE employee_id = $1`,
            [employee_id]
        );

        res.json({
            employee: employeeResult.rows[0],
            promotions: promotionsResult.rows,
            groupChanges: groupChangesResult.rows,
            attrition: attritionResult.rows[0] || null
        });
    } catch (error: unknown) {
        console.error('Error in getEmployeeHistory:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    } finally {
        client.release();
    }
}; 