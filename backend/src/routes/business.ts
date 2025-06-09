import { Router, Request, Response, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db/db';
import agreementsRouter from './business/agreements';

const router = Router();

// Use agreements router
router.use('/agreements', agreementsRouter);

// ==================== Clients Routes ====================
router.get('/clients', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients ORDER BY client_name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/clients', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_name, contact_person, email, address, description } = req.body;

    if (!client_name || !contact_person || !email || !address) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO clients (client_name, contact_person, email, address, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [client_name, contact_person, email, address, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

router.put('/clients/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { client_name, contact_person, email, address, description } = req.body;

    if (!client_name || !contact_person || !email || !address) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `UPDATE clients
       SET client_name = $1, contact_person = $2, email = $3, address = $4, description = $5
       WHERE id = $6
       RETURNING *`,
      [client_name, contact_person, email, address, description, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

router.delete('/clients/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Client not found' });
      return;
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// ==================== Business Entities Routes ====================
router.get('/business-entities', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT be.*, c.client_name
       FROM business_entities be
       LEFT JOIN clients c ON be.client_id = c.id
       ORDER BY be.name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching business entities:', error);
    res.status(500).json({ error: 'Failed to fetch business entities' });
  }
});

router.post('/business-entities', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      entity_type,
      client_id,
      start_date,
      end_date,
      order_value,
      payment_duration,
      description
    } = req.body;

    if (!name || !entity_type || !client_id || !start_date || !end_date || !order_value || !payment_duration) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO business_entities (
        name, entity_type, client_id, start_date, end_date,
        order_value, payment_duration, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [name, entity_type, client_id, start_date, end_date, order_value, payment_duration, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating business entity:', error);
    res.status(500).json({ error: 'Failed to create business entity' });
  }
});

router.put('/business-entities/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, entity_type, client_id, start_date, end_date, order_value, payment_duration, description } = req.body;

    if (!name || !entity_type || !client_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      'UPDATE business_entities SET name = $1, entity_type = $2, client_id = $3, start_date = $4, end_date = $5, order_value = $6, payment_duration = $7, description = $8 WHERE id = $9 RETURNING *',
      [name, entity_type, client_id, start_date, end_date, order_value, payment_duration, description, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Business entity not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating business entity:', error);
    res.status(500).json({ error: 'Failed to update business entity' });
  }
});

router.delete('/business-entities/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM business_entities WHERE id = $1', [id]);
    res.status(200).json({ message: 'Business entity deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting business entity:', error);
    // Check if error is from our trigger
    if (error.message.includes('Cannot delete business entity')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete business entity' });
    }
  }
});

// ==================== Services Routes ====================
router.get('/services', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.entity_id,
        s.service_type,
        s.status,
        s.service_specific_details,
        be.name as entity_name,
        be.client_id,
        c.client_name,
        be.start_date,
        be.end_date,
        be.order_value,
        s.created_at,
        s.updated_at
      FROM services s
      JOIN business_entities be ON s.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.post('/services', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, service_type, status, service_specific_details } = req.body;

    if (!entity_id || !service_type) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert the service
      const result = await client.query(
        `INSERT INTO services (
          entity_id, service_type, status, service_specific_details
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [entity_id, service_type, status || 'active', service_specific_details || {}]
      );

      // Get the complete service data with related information
      const completeResult = await client.query(`
        SELECT 
          s.id,
          s.entity_id,
          s.service_type,
          s.status,
          s.service_specific_details,
          be.name as entity_name,
          be.client_id,
          c.client_name,
          be.start_date,
          be.end_date,
          be.order_value,
          s.created_at,
          s.updated_at
        FROM services s
        JOIN business_entities be ON s.entity_id = be.id
        LEFT JOIN clients c ON be.client_id = c.id
        WHERE s.id = $1
      `, [result.rows[0].id]);

      await client.query('COMMIT');
      res.status(201).json(completeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

router.put('/services/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { service_type, status, service_specific_details } = req.body;

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the service
      const result = await client.query(
        `UPDATE services 
         SET service_type = $1, 
             status = $2, 
             service_specific_details = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [service_type, status, service_specific_details || {}, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      // Get the complete service data with related information
      const completeResult = await client.query(`
        SELECT 
          s.id,
          s.entity_id,
          s.service_type,
          s.status,
          s.service_specific_details,
          be.name as entity_name,
          be.client_id,
          c.client_name,
          be.start_date,
          be.end_date,
          be.order_value,
          s.created_at,
          s.updated_at
        FROM services s
        JOIN business_entities be ON s.entity_id = be.id
        LEFT JOIN clients c ON be.client_id = c.id
        WHERE s.id = $1
      `, [id]);

      await client.query('COMMIT');
      res.json(completeResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/services/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

router.get('/services/:id/details', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { service_type } = req.query;

    if (!service_type) {
      res.status(400).json({ error: 'Service type is required' });
      return;
    }

    let result;
    switch (service_type) {
      case 'hpc':
        result = await pool.query(
          'SELECT * FROM hpc_services WHERE service_id = $1',
          [id]
        );
        break;
      case 'vapt':
        result = await pool.query(
          'SELECT * FROM vapt_services WHERE service_id = $1',
          [id]
        );
        break;
      case 'training':
        result = await pool.query(
          'SELECT * FROM training_services WHERE service_id = $1',
          [id]
        );
        break;
      default:
        res.status(400).json({ error: 'Invalid service type' });
        return;
    }

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Service details not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

router.post('/services/:id/details', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { service_type } = req.query;

    if (!service_type) {
      res.status(400).json({ error: 'Service type is required' });
      return;
    }

    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let result;
      switch (service_type) {
        case 'hpc':
          const {
            num_cores,
            billing_start_date,
            billing_end_date,
            payment_type,
            order_value,
            comments
          } = req.body;

          // Validate required fields
          if (!num_cores || !billing_start_date || !billing_end_date || !payment_type || !order_value) {
            res.status(400).json({ error: 'Missing required fields for HPC service' });
            return;
          }

          result = await client.query(
            `INSERT INTO hpc_services (
              service_id, num_cores, billing_start_date, billing_end_date,
              payment_type, order_value, comments
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (service_id)
            DO UPDATE SET
              num_cores = EXCLUDED.num_cores,
              billing_start_date = EXCLUDED.billing_start_date,
              billing_end_date = EXCLUDED.billing_end_date,
              payment_type = EXCLUDED.payment_type,
              order_value = EXCLUDED.order_value,
              comments = EXCLUDED.comments
            RETURNING *`,
            [id, num_cores, billing_start_date, billing_end_date, payment_type, order_value, comments]
          );
          break;

        case 'vapt':
          const {
            billing_start_date: vaptStartDate,
            billing_end_date: vaptEndDate,
            payment_type: vaptPaymentType,
            order_value: vaptOrderValue,
            comments: vaptComments
          } = req.body;

          // Validate required fields
          if (!vaptStartDate || !vaptEndDate || !vaptPaymentType || !vaptOrderValue) {
            res.status(400).json({ error: 'Missing required fields for VAPT service' });
            return;
          }

          result = await client.query(
            `INSERT INTO vapt_services (
              service_id, billing_start_date, billing_end_date,
              payment_type, order_value, comments
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (service_id)
            DO UPDATE SET
              billing_start_date = EXCLUDED.billing_start_date,
              billing_end_date = EXCLUDED.billing_end_date,
              payment_type = EXCLUDED.payment_type,
              order_value = EXCLUDED.order_value,
              comments = EXCLUDED.comments
            RETURNING *`,
            [id, vaptStartDate, vaptEndDate, vaptPaymentType, vaptOrderValue, vaptComments]
          );
          break;

        case 'training':
          const {
            training_on,
            order_value: trainingOrderValue,
            start_date,
            end_date
          } = req.body;

          // Validate required fields
          if (!training_on || !trainingOrderValue || !start_date || !end_date) {
            res.status(400).json({ error: 'Missing required fields for training service' });
            return;
          }

          result = await client.query(
            `INSERT INTO training_services (
              service_id, training_on, order_value, start_date, end_date
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (service_id)
            DO UPDATE SET
              training_on = EXCLUDED.training_on,
              order_value = EXCLUDED.order_value,
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date
            RETURNING *`,
            [id, training_on, trainingOrderValue, start_date, end_date]
          );
          break;

        default:
          res.status(400).json({ error: 'Invalid service type' });
          return;
      }

      // Update the business entity order value
      await client.query(
        `UPDATE business_entities 
         SET order_value = $1 
         WHERE id = (SELECT entity_id FROM services WHERE id = $2)`,
        [req.body.order_value, id]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating service details:', error);
    res.status(500).json({ error: 'Failed to update service details' });
  }
});

// ==================== Purchase Orders Routes ====================
router.get('/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT po.*, be.name as entity_name, be.entity_type,
              c.client_name, e.employee_name as requested_by_name
       FROM purchase_orders_bd po
       LEFT JOIN business_entities be ON po.entity_id = be.id
       LEFT JOIN clients c ON be.client_id = c.id
       LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
       ORDER BY po.invoice_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      entity_id,
      invoice_no,
      invoice_date,
      invoice_value,
      payment_duration,
      invoice_status,
      requested_by,
      payment_mode,
      remarks
    } = req.body;

    if (!entity_id || !invoice_no || !invoice_date || !invoice_value || !invoice_status || !requested_by) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate employee exists
    const employeeExists = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM hr_employees WHERE employee_id = $1)',
      [requested_by]
    );

    if (!employeeExists.rows[0].exists) {
      res.status(400).json({ error: 'Invalid employee ID' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO purchase_orders_bd (
        entity_id, invoice_no, invoice_date, invoice_value,
        payment_duration, invoice_status, requested_by,
        payment_mode, remarks
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        entity_id,
        invoice_no,
        invoice_date,
        invoice_value,
        payment_duration,
        invoice_status,
        requested_by,
        payment_mode,
        remarks
      ]
    );

    // Fetch complete purchase order data with related information
    const completeResult = await pool.query(
      `SELECT po.*, be.name as entity_name, be.entity_type,
              c.client_name, e.employee_name as requested_by_name
       FROM purchase_orders_bd po
       LEFT JOIN business_entities be ON po.entity_id = be.id
       LEFT JOIN clients c ON be.client_id = c.id
       LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
       WHERE po.po_id = $1`,
      [result.rows[0].po_id]
    );

    res.status(201).json(completeResult.rows[0]);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.put('/purchase-orders/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      entity_id,
      invoice_no,
      invoice_date,
      invoice_value,
      payment_duration,
      invoice_status,
      requested_by,
      payment_mode,
      remarks
    } = req.body;

    if (!entity_id || !invoice_no || !invoice_date || !invoice_value || !invoice_status || !requested_by) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate employee exists
    const employeeExists = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM hr_employees WHERE employee_id = $1)',
      [requested_by]
    );

    if (!employeeExists.rows[0].exists) {
      res.status(400).json({ error: 'Invalid employee ID' });
      return;
    }

    const result = await pool.query(
      `UPDATE purchase_orders_bd
       SET entity_id = $1, invoice_no = $2, invoice_date = $3,
           invoice_value = $4, payment_duration = $5, invoice_status = $6,
           requested_by = $7, payment_mode = $8, remarks = $9
       WHERE po_id = $10
       RETURNING *`,
      [
        entity_id,
        invoice_no,
        invoice_date,
        invoice_value,
        payment_duration,
        invoice_status,
        requested_by,
        payment_mode,
        remarks,
        id
      ]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    // Fetch complete purchase order data with related information
    const completeResult = await pool.query(
      `SELECT po.*, be.name as entity_name, be.entity_type,
              c.client_name, e.employee_name as requested_by_name
       FROM purchase_orders_bd po
       LEFT JOIN business_entities be ON po.entity_id = be.id
       LEFT JOIN clients c ON be.client_id = c.id
       LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
       WHERE po.po_id = $1`,
      [id]
    );

    res.json(completeResult.rows[0]);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

router.delete('/purchase-orders/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM purchase_orders_bd WHERE po_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// ==================== Technical Group Mappings Routes ====================
router.get('/technical-group-mappings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT bgm.*, 
              be.name as entity_name,
              tg.group_name,
              e.employee_name as contact_person_name
       FROM business_group_mappings bgm
       JOIN business_entities be ON bgm.entity_id = be.id
       JOIN technical_groups tg ON bgm.group_id = tg.group_id
       LEFT JOIN hr_employees e ON bgm.contact_person_id = e.employee_id
       ORDER BY be.name, tg.group_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching group mappings:', error);
    res.status(500).json({ error: 'Failed to fetch group mappings' });
  }
});

router.post('/group-mappings', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, group_id, contact_person_id, role } = req.body;

    if (!entity_id || !group_id || !contact_person_id || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO business_group_mappings (entity_id, group_id, contact_person_id, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [entity_id, group_id, contact_person_id, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group mapping:', error);
    res.status(500).json({ error: 'Failed to create group mapping' });
  }
});

router.put('/group-mappings/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { entity_id, group_id, contact_person_id, role } = req.body;

    if (!entity_id || !group_id || !contact_person_id || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `UPDATE business_group_mappings
       SET entity_id = $1, group_id = $2, contact_person_id = $3, role = $4
       WHERE id = $5
       RETURNING *`,
      [entity_id, group_id, contact_person_id, role, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Group mapping not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating group mapping:', error);
    res.status(500).json({ error: 'Failed to update group mapping' });
  }
});

router.delete('/group-mappings/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM business_group_mappings WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Group mapping not found' });
      return;
    }

    res.json({ message: 'Group mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting group mapping:', error);
    res.status(500).json({ error: 'Failed to delete group mapping' });
  }
});

// ==================== Products Routes ====================
router.get('/products', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.*, be.name as entity_name, c.client_name, be.order_value
      FROM products p
      JOIN business_entities be ON p.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      ORDER BY be.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/products/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, be.name as entity_name, tg.group_name, c.client_name
      FROM products p
      JOIN business_entities be ON p.entity_id = be.id
      LEFT JOIN technical_groups tg ON p.group_id = tg.group_id
      LEFT JOIN clients c ON be.client_id = c.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/products', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, status, specifications } = req.body;

    if (!entity_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO products (entity_id, status, specifications)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [entity_id, status || 'active', specifications]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, specifications } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET status = $1, specifications = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, specifications, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== Projects Routes ====================
router.get('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.*, be.name as entity_name, c.client_name
      FROM business_division_projects p
      JOIN business_entities be ON p.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, status, extended_date, milestones } = req.body;

    if (!entity_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO business_division_projects (
        entity_id, status, extended_date, milestones
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [entity_id, status || 'active', extended_date, milestones || {}]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.put('/projects/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, extended_date, milestones } = req.body;

    const result = await pool.query(
      `UPDATE business_division_projects 
       SET status = $1, extended_date = $2, milestones = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, extended_date, milestones || {}, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

router.delete('/projects/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM business_division_projects WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router; 