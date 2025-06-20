import { Router, Request, Response, RequestHandler } from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../db/db';

const router = Router();

// Helper function to auto-update PO status based on payments
const autoUpdatePOStatus = async (poId: number, userId: number) => {
  try {
    // Get PO details
    const poResult = await pool.query(
      'SELECT * FROM purchase_orders_bd WHERE po_id = $1',
      [poId]
    );

    if (poResult.rows.length === 0) return;

    const po = poResult.rows[0];

    // Get total payments received
    const paymentsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_received
      FROM entity_payments 
      WHERE po_id = $1 AND status = 'received'
    `, [poId]);

    const totalReceived = parseFloat(paymentsResult.rows[0].total_received);
    const invoiceValue = parseFloat(po.invoice_value);

    // Determine new status
    let newStatus = po.status;
    if (totalReceived === 0) {
      newStatus = 'Payment Pending';
    } else if (totalReceived < invoiceValue) {
      newStatus = 'Partial Payment';
    } else if (totalReceived >= invoiceValue) {
      newStatus = 'Paid Completely';
    }

    // Update status if changed
    if (newStatus !== po.status) {
      await pool.query(
        'UPDATE purchase_orders_bd SET status = $1 WHERE po_id = $2',
        [newStatus, poId]
      );

      // Record status change
      await pool.query(`
        INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5)
      `, [poId, po.status, newStatus, userId, 'Auto-updated based on payment milestones']);
    }
  } catch (error) {
    console.error('Error auto-updating PO status:', error);
  }
};

// ==================== Clients Routes ====================
router.get('/clients', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients ORDER BY client_name'
    );
    
    console.log('Raw database result:', result.rows); // Debug log
    
    // No transformation needed since column name matches
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

router.post('/clients', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_name, contact_person, contact_number, email, address, description } = req.body;

    if (!client_name || !contact_person || !contact_number || !email || !address) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO clients (client_name, contact_person, contact_number, email, address, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [client_name, contact_person, contact_number, email, address, description]
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
    const { client_name, contact_person, contact_number, email, address, description } = req.body;

    if (!client_name || !contact_person || !contact_number || !email || !address) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `UPDATE clients
       SET client_name = $1, contact_person = $2, contact_number = $3, email = $4, address = $5, description = $6
       WHERE id = $7
       RETURNING *`,
      [client_name, contact_person, contact_number, email, address, description, id]
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
  const client = await pool.connect();
  try {
    const {
      name,
      entity_type,
      service_type,
      client_id,
      start_date,
      end_date,
      order_value,
      payment_duration,
      description,
      service_data
    } = req.body;

    if (!name || !entity_type || !client_id || !start_date || !end_date || !order_value || !payment_duration) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate service_type when entity_type is 'service'
    if (entity_type === 'service' && !service_type) {
      res.status(400).json({ error: 'Service type is required when entity type is service' });
      return;
    }

    // Validate service_data when entity_type is 'service'
    if (entity_type === 'service' && !service_data) {
      res.status(400).json({ error: 'Service data is required when entity type is service' });
      return;
    }

    // Check for duplicate business entity with same name and client
    const duplicateCheck = await client.query(
      'SELECT id FROM business_entities WHERE name = $1 AND client_id = $2',
      [name, client_id]
    );

    if (duplicateCheck.rows.length > 0) {
      res.status(400).json({ error: 'Business entity with this name already exists for this client' });
      return;
    }

    // Start transaction
    await client.query('BEGIN');

    // 1. Create business entity
    const businessEntityResult = await client.query(
      `INSERT INTO business_entities (
        name, entity_type, service_type, client_id, start_date, end_date,
        order_value, payment_duration, description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [name, entity_type, service_type, client_id, start_date, end_date, order_value, payment_duration, description]
    );

    const entityId = businessEntityResult.rows[0].id;

    // 2. Create corresponding record based on entity_type
    if (entity_type === 'product') {
      await client.query(
        'INSERT INTO products_bd (entity_id) VALUES ($1)',
        [entityId]
      );
    } else if (entity_type === 'service') {
      // Create service record
      const serviceResult = await client.query(
        'INSERT INTO services_bd (entity_id) VALUES ($1) RETURNING id',
        [entityId]
      );
      
      const serviceId = serviceResult.rows[0].id;
      
      // Create service-specific record based on service_type
      if (service_type === 'hpc' && service_data.num_cores) {
        await client.query(
          'INSERT INTO hpc_services (service_id, num_cores) VALUES ($1, $2)',
          [serviceId, service_data.num_cores]
        );
      } else if (service_type === 'training' && service_data.training_on) {
        await client.query(
          'INSERT INTO training_services (service_id, training_on) VALUES ($1, $2)',
          [serviceId, service_data.training_on]
        );
      } else if (service_type === 'vapt' && service_data.manpower_count && service_data.service_category) {
        await client.query(
          'INSERT INTO vapt_services (service_id, manpower_count, service_category) VALUES ($1, $2, $3)',
          [serviceId, service_data.manpower_count, service_data.service_category]
        );
      }
    } else if (entity_type === 'project') {
      await client.query(
        'INSERT INTO projects_bd (entity_id, extended_date) VALUES ($1, NULL)',
        [entityId]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    // Get the complete business entity with client name for response
    const finalResult = await client.query(
      `SELECT be.*, c.client_name
       FROM business_entities be
       LEFT JOIN clients c ON be.client_id = c.id
       WHERE be.id = $1`,
      [entityId]
    );

    res.status(201).json(finalResult.rows[0]);
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error creating business entity:', error);
    res.status(500).json({ error: 'Failed to create business entity' });
  } finally {
    client.release();
  }
});

router.put('/business-entities/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, entity_type, service_type, client_id, start_date, end_date, order_value, payment_duration, description } = req.body;

    if (!name || !entity_type || !client_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate service_type when entity_type is 'service'
    if (entity_type === 'service' && !service_type) {
      res.status(400).json({ error: 'Service type is required when entity type is service' });
      return;
    }

    const result = await pool.query(
      'UPDATE business_entities SET name = $1, entity_type = $2, service_type = $3, client_id = $4, start_date = $5, end_date = $6, order_value = $7, payment_duration = $8, description = $9 WHERE id = $10 RETURNING *',
      [name, entity_type, service_type, client_id, start_date, end_date, order_value, payment_duration, description, id]
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
    
    // Check if there are purchase orders for this entity
    const poCheck = await pool.query(
      'SELECT COUNT(*) as po_count FROM purchase_orders_bd WHERE entity_id = $1',
      [id]
    );
    
    const poCount = parseInt(poCheck.rows[0].po_count);
    
    // Check if there are entity payments for this entity and get details
    const paymentCheck = await pool.query(
      `SELECT ep.id, ep.amount, ep.payment_date, ep.status, ep.remarks, be.name as entity_name
       FROM entity_payments ep
       JOIN business_entities be ON ep.entity_id = be.id
       WHERE ep.entity_id = $1`,
      [id]
    );
    
    const paymentCount = paymentCheck.rows.length;
    console.log(`Found ${paymentCount} payment milestones for entity ${id}:`, paymentCheck.rows);
    
    if (paymentCount > 0) {
      const paymentDetails = paymentCheck.rows.map(p => ({
        id: p.id,
        amount: p.amount,
        payment_date: p.payment_date,
        status: p.status,
        remarks: p.remarks
      }));
      
      console.log('Payment details being sent to frontend:', paymentDetails);
      
      res.status(400).json({ 
        error: `Cannot delete business entity: It has ${paymentCount} payment milestone(s) that must be deleted first.`,
        details: `Please delete the payment milestones before deleting this business entity.`,
        payment_milestones: paymentDetails,
        entity_name: paymentCheck.rows[0]?.entity_name || 'Unknown Entity'
      });
      return;
    }
    
    // The actual deletion is handled by the database trigger
    await pool.query('DELETE FROM business_entities WHERE id = $1', [id]);
    
    if (poCount > 0) {
      // Return warning with count of purchase orders that were deleted
      res.status(200).json({ 
        message: `Business entity deleted successfully. ${poCount} purchase order(s) were also deleted.`,
        warning: `This action deleted ${poCount} purchase order(s) associated with this business entity.`
      });
    } else {
      res.status(200).json({ message: 'Business entity deleted successfully' });
    }
    
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
        be.name as entity_name,
        be.start_date,
        be.end_date,
        be.order_value,
        be.service_type,
        c.client_name,
        -- HPC Services
        hpc.num_cores as hpc_cores,
        -- Training Services
        tr.training_on as training_topic,
        -- VAPT Services
        vapt.manpower_count as vapt_manpower,
        vapt.service_category as vapt_category
      FROM services_bd s
      JOIN business_entities be ON s.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      LEFT JOIN hpc_services hpc ON s.id = hpc.service_id
      LEFT JOIN training_services tr ON s.id = tr.service_id
      LEFT JOIN vapt_services vapt ON s.id = vapt.service_id
      ORDER BY be.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/services/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        s.id,
        s.entity_id,
        be.name as entity_name,
        be.start_date,
        be.end_date,
        be.order_value,
        c.client_name,
        -- HPC Services
        hpc.num_cores as hpc_cores,
        hpc.billing_start_date as hpc_billing_start,
        hpc.billing_end_date as hpc_billing_end,
        -- Training Services
        tr.training_on as training_topic,
        tr.start_date as training_start_date,
        tr.end_date as training_end_date,
        -- VAPT Services
        vapt.billing_start_date as vapt_billing_start,
        vapt.billing_end_date as vapt_billing_end,
        -- Determine service type
        CASE 
          WHEN hpc.id IS NOT NULL THEN 'HPC'
          WHEN tr.id IS NOT NULL THEN 'Training'
          WHEN vapt.id IS NOT NULL THEN 'VAPT'
          ELSE 'Unknown'
        END as service_type
      FROM services_bd s
      JOIN business_entities be ON s.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      LEFT JOIN hpc_services hpc ON s.id = hpc.service_id
      LEFT JOIN training_services tr ON s.id = tr.service_id
      LEFT JOIN vapt_services vapt ON s.id = vapt.service_id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

router.post('/services', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, service_data } = req.body;
    
    console.log('Services POST route hit with data:', { entity_id, service_data });

    if (!entity_id || !service_data) {
      console.log('Missing required fields:', { entity_id, service_data });
      res.status(400).json({ error: 'Missing required fields: entity_id and service_data are required' });
      return;
    }

    // Get business entity to determine service type
    const businessEntityResult = await pool.query(
      'SELECT service_type FROM business_entities WHERE id = $1',
      [entity_id]
    );

    if (businessEntityResult.rows.length === 0) {
      res.status(404).json({ error: 'Business entity not found' });
      return;
    }

    const serviceType = businessEntityResult.rows[0].service_type;
    console.log('Service type from business entity:', serviceType);

    // Start transaction
    const client = await pool.connect();
    await client.query('BEGIN');

    try {
      // Check if service already exists for this entity
      const existingServiceResult = await client.query(
        'SELECT id FROM services_bd WHERE entity_id = $1',
        [entity_id]
      );

      let serviceId: number;

      if (existingServiceResult.rows.length > 0) {
        // Service already exists, use existing service_id
        serviceId = existingServiceResult.rows[0].id;
        console.log('Using existing service with ID:', serviceId);
      } else {
        // Create new service record
        console.log('Creating new service record for entity_id:', entity_id);
        const serviceResult = await client.query(
          `INSERT INTO services_bd (entity_id)
           VALUES ($1)
           RETURNING id`,
          [entity_id]
        );
        serviceId = serviceResult.rows[0].id;
        console.log('Created new service with ID:', serviceId);
      }

      // Create or update type-specific record based on business entity service_type
      if (serviceType === 'hpc') {
        console.log('Creating/Updating HPC service with data:', service_data);
        // Check if HPC service already exists
        const existingHpcResult = await client.query(
          'SELECT id FROM hpc_services WHERE service_id = $1',
          [serviceId]
        );

        if (existingHpcResult.rows.length > 0) {
          // Update existing HPC service
          await client.query(
            `UPDATE hpc_services 
             SET num_cores = $1
             WHERE service_id = $2`,
            [service_data.num_cores, serviceId]
          );
        } else {
          // Create new HPC service
          await client.query(
            `INSERT INTO hpc_services (service_id, num_cores)
             VALUES ($1, $2)`,
            [serviceId, service_data.num_cores]
          );
        }
      } else if (serviceType === 'training') {
        console.log('Creating/Updating Training service with data:', service_data);
        const existingTrainingResult = await client.query(
          'SELECT id FROM training_services WHERE service_id = $1',
          [serviceId]
        );

        if (existingTrainingResult.rows.length > 0) {
          await client.query(
            `UPDATE training_services 
             SET training_on = $1
             WHERE service_id = $2`,
            [service_data.training_on, serviceId]
          );
        } else {
          await client.query(
            `INSERT INTO training_services (service_id, training_on)
             VALUES ($1, $2)`,
            [serviceId, service_data.training_on]
          );
        }
      } else if (serviceType === 'vapt') {
        console.log('Creating/Updating VAPT service with data:', service_data);
        const existingVaptResult = await client.query(
          'SELECT id FROM vapt_services WHERE service_id = $1',
          [serviceId]
        );

        if (existingVaptResult.rows.length > 0) {
          await client.query(
            `UPDATE vapt_services 
             SET manpower_count = $1, service_category = $2
             WHERE service_id = $3`,
            [service_data.manpower_count, service_data.service_category, serviceId]
          );
        } else {
          await client.query(
            `INSERT INTO vapt_services (service_id, manpower_count, service_category)
             VALUES ($1, $2, $3)`,
            [serviceId, service_data.manpower_count, service_data.service_category]
          );
        }
      }

      await client.query('COMMIT');
      console.log('Transaction committed successfully');

      // Get the complete service data for response
      const finalResult = await client.query(`
        SELECT 
          s.id,
          s.entity_id,
          be.name as entity_name,
          be.start_date,
          be.end_date,
          be.order_value,
          be.service_type,
          c.client_name,
          -- HPC Services
          hpc.num_cores as hpc_cores,
          -- Training Services
          tr.training_on as training_topic,
          -- VAPT Services
          vapt.manpower_count as vapt_manpower,
          vapt.service_category as vapt_category
        FROM services_bd s
        JOIN business_entities be ON s.entity_id = be.id
        LEFT JOIN clients c ON be.client_id = c.id
        LEFT JOIN hpc_services hpc ON s.id = hpc.service_id
        LEFT JOIN training_services tr ON s.id = tr.service_id
        LEFT JOIN vapt_services vapt ON s.id = vapt.service_id
        WHERE s.id = $1
      `, [serviceId]);

      console.log('Final result:', finalResult.rows[0]);
      res.status(201).json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in transaction:', error);
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
    const { entity_id, service_type, service_data } = req.body;
    
    console.log('Services PUT route hit with id:', id, 'and data:', { entity_id, service_type, service_data });

    if (!entity_id || !service_type || !service_data) {
      console.log('Missing required fields:', { entity_id, service_type, service_data });
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Start transaction
    const client = await pool.connect();
    await client.query('BEGIN');

    try {
      // Update business entity with service duration dates
      if (service_data.start_date && service_data.end_date) {
        console.log('Updating business entity with dates:', { start_date: service_data.start_date, end_date: service_data.end_date, entity_id });
        await client.query(
          `UPDATE business_entities 
           SET start_date = $1, end_date = $2
           WHERE id = $3`,
          [service_data.start_date, service_data.end_date, entity_id]
        );
      }

      // Update service record
      console.log('Updating service record for id:', id, 'with entity_id:', entity_id);
      await client.query(
        `UPDATE services_bd 
         SET entity_id = $1
         WHERE id = $2`,
        [entity_id, id]
      );

      // Update type-specific record
      if (service_type === 'HPC') {
        console.log('Updating HPC service with data:', service_data);
        await client.query(
          `UPDATE hpc_services 
           SET num_cores = $1, billing_start_date = $2, billing_end_date = $3
           WHERE service_id = $4`,
          [service_data.num_cores, service_data.billing_start_date, service_data.billing_end_date, id]
        );
      } else if (service_type === 'Training') {
        console.log('Updating Training service with data:', service_data);
        await client.query(
          `UPDATE training_services 
           SET training_on = $1, start_date = $2, end_date = $3
           WHERE service_id = $4`,
          [service_data.training_on, service_data.start_date, service_data.end_date, id]
        );
      } else if (service_type === 'VAPT') {
        console.log('Updating VAPT service with data:', service_data);
        await client.query(
          `UPDATE vapt_services 
           SET billing_start_date = $1, billing_end_date = $2
           WHERE service_id = $3`,
          [service_data.billing_start_date, service_data.billing_end_date, id]
        );
      }

      await client.query('COMMIT');
      console.log('Transaction committed successfully');

      // Get the updated service data for response
      const finalResult = await client.query(`
        SELECT 
          s.id,
          s.entity_id,
          be.name as entity_name,
          be.start_date,
          be.end_date,
          be.order_value,
          c.client_name,
          -- HPC Services
          hpc.num_cores as hpc_cores,
          hpc.billing_start_date as hpc_billing_start,
          hpc.billing_end_date as hpc_billing_end,
          -- Training Services
          tr.training_on as training_topic,
          tr.start_date as training_start_date,
          tr.end_date as training_end_date,
          -- VAPT Services
          vapt.billing_start_date as vapt_billing_start,
          vapt.billing_end_date as vapt_billing_end,
          -- Determine service type
          CASE 
            WHEN hpc.id IS NOT NULL THEN 'HPC'
            WHEN tr.id IS NOT NULL THEN 'Training'
            WHEN vapt.id IS NOT NULL THEN 'VAPT'
            ELSE 'Unknown'
          END as service_type
        FROM services_bd s
        JOIN business_entities be ON s.entity_id = be.id
        LEFT JOIN clients c ON be.client_id = c.id
        LEFT JOIN hpc_services hpc ON s.id = hpc.service_id
        LEFT JOIN training_services tr ON s.id = tr.service_id
        LEFT JOIN vapt_services vapt ON s.id = vapt.service_id
        WHERE s.id = $1
      `, [id]);

      if (finalResult.rows.length === 0) {
        console.log('Service not found with id:', id);
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      console.log('Final result:', finalResult.rows[0]);
      res.json(finalResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in transaction:', error);
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
    
    // First get the entity_id to check for payment milestones
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;

    // Check for payment milestones
    const milestonesResult = await pool.query(
      'SELECT COUNT(*) as count FROM entity_payments WHERE entity_id = $1',
      [entityId]
    );

    const milestoneCount = parseInt(milestonesResult.rows[0].count);
    
    if (milestoneCount > 0) {
      res.status(400).json({ 
        error: `Cannot delete service. It has ${milestoneCount} payment milestone(s) associated with it. Please delete the payment milestones first.` 
      });
      return;
    }

    const result = await pool.query('DELETE FROM services_bd WHERE id = $1 RETURNING *', [id]);

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

// ==================== Services Payment Milestones Routes ====================
router.get('/services/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Services payment milestones GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from services_bd table
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for service_id:', id);

    const result = await pool.query(`
      SELECT ep.*, po.invoice_no, po.invoice_value
      FROM entity_payments ep
      LEFT JOIN purchase_orders_bd po ON ep.po_id = po.po_id
      WHERE ep.entity_id = $1
      ORDER BY ep.payment_date DESC
    `, [entityId]);
    
    console.log('Found payment milestones:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment milestones:', error);
    res.status(500).json({ error: 'Failed to fetch payment milestones' });
  }
});

router.post('/services/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Services payment milestones POST route hit with id:', req.params.id, 'body:', req.body);
  try {
    const { id } = req.params;
    const { payment_date, amount, status, remarks, po_id, billing_start_date, billing_end_date } = req.body;

    if (!payment_date || !amount || !po_id || !billing_start_date || !billing_end_date) {
      res.status(400).json({ error: 'Missing required fields: payment_date, amount, po_id, billing_start_date, and billing_end_date are required' });
      return;
    }

    // First get the entity_id from services_bd table
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for service_id:', id);

    // Verify that the purchase order exists and belongs to this entity
    const poResult = await pool.query(
      'SELECT po_id FROM purchase_orders_bd WHERE po_id = $1 AND entity_id = $2',
      [po_id, entityId]
    );

    if (poResult.rows.length === 0) {
      res.status(400).json({ error: 'Purchase order not found or does not belong to this service' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO entity_payments (entity_id, po_id, payment_date, amount, status, remarks, billing_start_date, billing_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [entityId, po_id, payment_date, amount, status || 'pending', remarks || '', billing_start_date, billing_end_date]
    );

    // Auto-update PO status
    await autoUpdatePOStatus(po_id, (req as any).user.id);

    console.log('Created payment milestone:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment milestone:', error);
    res.status(500).json({ error: 'Failed to create payment milestone' });
  }
});

router.put('/services/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    const { payment_date, amount, status, remarks, billing_start_date, billing_end_date } = req.body;

    // First get the entity_id from services_bd table
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;

    const result = await pool.query(
      `UPDATE entity_payments 
       SET payment_date = $1, amount = $2, status = $3, remarks = $4, billing_start_date = $5, billing_end_date = $6
       WHERE id = $7 AND entity_id = $8
       RETURNING *`,
      [payment_date, amount, status, remarks, billing_start_date, billing_end_date, paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment milestone:', error);
    res.status(500).json({ error: 'Failed to update payment milestone' });
  }
});

router.delete('/services/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    
    // First get the entity_id from services_bd table
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;
    
    const result = await pool.query(
      'DELETE FROM entity_payments WHERE id = $1 AND entity_id = $2 RETURNING *',
      [paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json({ message: 'Payment milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment milestone:', error);
    res.status(500).json({ error: 'Failed to delete payment milestone' });
  }
});

// ==================== Services Purchase Orders Routes ====================
router.get('/services/:id/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Services purchase orders GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from services_bd table
    const serviceResult = await pool.query(
      'SELECT entity_id FROM services_bd WHERE id = $1',
      [id]
    );

    if (serviceResult.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    const entityId = serviceResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for service_id:', id);

    const result = await pool.query(`
      SELECT po.*, e.employee_name as requested_by_name
      FROM purchase_orders_bd po
      LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
      WHERE po.entity_id = $1 
      ORDER BY po.invoice_date
    `, [entityId]);
    
    console.log('Found purchase orders:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// ==================== Projects Routes ====================
router.get('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.entity_id,
        p.extended_date,
        be.name as entity_name,
        be.start_date,
        be.end_date,
        be.order_value,
        c.client_name
      FROM projects_bd p
      JOIN business_entities be ON p.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/projects', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, extended_date } = req.body;

    if (!entity_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO projects_bd (entity_id, extended_date)
       VALUES ($1, $2)
       RETURNING *`,
      [entity_id, extended_date]
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
    const { entity_id, extended_date } = req.body;

    const result = await pool.query(
      `UPDATE projects_bd 
       SET entity_id = $1, extended_date = $2
       WHERE id = $3
       RETURNING *`,
      [entity_id, extended_date, id]
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
    const result = await pool.query('DELETE FROM projects_bd WHERE id = $1 RETURNING *', [id]);

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

// ==================== Payment Milestones Routes ====================
console.log('Registering payment milestone routes...');
router.get('/projects/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Payment milestones GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from projects_bd table
    const projectResult = await pool.query(
      'SELECT entity_id FROM projects_bd WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const entityId = projectResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for project_id:', id);

    const result = await pool.query(`
      SELECT * FROM entity_payments 
      WHERE entity_id = $1 
      ORDER BY payment_date
    `, [entityId]);
    
    console.log('Found payment milestones:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment milestones:', error);
    res.status(500).json({ error: 'Failed to fetch payment milestones' });
  }
});

router.post('/projects/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Payment milestones POST route hit with id:', req.params.id, 'body:', req.body);
  try {
    const { id } = req.params;
    const { payment_date, amount, status, remarks, po_id, billing_start_date, billing_end_date } = req.body;

    if (!payment_date || !amount || !po_id || !billing_start_date || !billing_end_date) {
      res.status(400).json({ error: 'Missing required fields: payment_date, amount, po_id, billing_start_date, and billing_end_date are required' });
      return;
    }

    // First get the entity_id from projects_bd table
    const projectResult = await pool.query(
      'SELECT entity_id FROM projects_bd WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const entityId = projectResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for project_id:', id);

    // Verify that the purchase order exists and belongs to this entity
    const poResult = await pool.query(
      'SELECT po_id FROM purchase_orders_bd WHERE po_id = $1 AND entity_id = $2',
      [po_id, entityId]
    );

    if (poResult.rows.length === 0) {
      res.status(400).json({ error: 'Purchase order not found or does not belong to this project' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO entity_payments (entity_id, po_id, payment_date, amount, status, remarks, billing_start_date, billing_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [entityId, po_id, payment_date, amount, status || 'pending', remarks || '', billing_start_date, billing_end_date]
    );

    // Auto-update PO status
    await autoUpdatePOStatus(po_id, (req as any).user.id);

    console.log('Created payment milestone:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment milestone:', error);
    res.status(500).json({ error: 'Failed to create payment milestone' });
  }
});

router.put('/projects/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    const { payment_date, amount, status, remarks, billing_start_date, billing_end_date } = req.body;

    // First get the entity_id from projects_bd table
    const projectResult = await pool.query(
      'SELECT entity_id FROM projects_bd WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const entityId = projectResult.rows[0].entity_id;

    const result = await pool.query(
      `UPDATE entity_payments 
       SET payment_date = $1, amount = $2, status = $3, remarks = $4, billing_start_date = $5, billing_end_date = $6
       WHERE id = $7 AND entity_id = $8
       RETURNING *`,
      [payment_date, amount, status, remarks, billing_start_date, billing_end_date, paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment milestone:', error);
    res.status(500).json({ error: 'Failed to update payment milestone' });
  }
});

router.delete('/projects/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    
    // First get the entity_id from projects_bd table
    const projectResult = await pool.query(
      'SELECT entity_id FROM projects_bd WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const entityId = projectResult.rows[0].entity_id;
    
    const result = await pool.query(
      'DELETE FROM entity_payments WHERE id = $1 AND entity_id = $2 RETURNING *',
      [paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json({ message: 'Payment milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment milestone:', error);
    res.status(500).json({ error: 'Failed to delete payment milestone' });
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

// ==================== Projects Purchase Orders Routes ====================
router.get('/projects/:id/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Purchase orders GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from projects_bd table
    const projectResult = await pool.query(
      'SELECT entity_id FROM projects_bd WHERE id = $1',
      [id]
    );

    if (projectResult.rows.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const entityId = projectResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for project_id:', id);

    const result = await pool.query(`
      SELECT po.*, e.employee_name as requested_by_name
      FROM purchase_orders_bd po
      LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
      WHERE po.entity_id = $1 
      ORDER BY po.invoice_date
    `, [entityId]);
    
    console.log('Found purchase orders:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// ==================== Products Routes ====================
router.get('/products', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.entity_id,
        be.name as entity_name,
        be.start_date,
        be.end_date,
        be.order_value,
        c.client_name
      FROM products_bd p
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
      SELECT 
        p.id,
        p.entity_id,
        be.name as entity_name,
        be.start_date,
        be.end_date,
        be.order_value,
        c.client_name
      FROM products_bd p
      JOIN business_entities be ON p.entity_id = be.id
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
    const { entity_id } = req.body;

    if (!entity_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO products_bd (entity_id)
       VALUES ($1)
       RETURNING *`,
      [entity_id]
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
    const { entity_id } = req.body;

    if (!entity_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `UPDATE products_bd 
       SET entity_id = $1
       WHERE id = $2
       RETURNING *`,
      [entity_id, id]
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
    
    // First get the entity_id to check for payment milestones
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;

    // Check for payment milestones
    const milestonesResult = await pool.query(
      'SELECT COUNT(*) as count FROM entity_payments WHERE entity_id = $1',
      [entityId]
    );

    const milestoneCount = parseInt(milestonesResult.rows[0].count);
    
    if (milestoneCount > 0) {
      res.status(400).json({ 
        error: `Cannot delete product. It has ${milestoneCount} payment milestone(s) associated with it. Please delete the payment milestones first.` 
      });
      return;
    }

    const result = await pool.query('DELETE FROM products_bd WHERE id = $1 RETURNING *', [id]);

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

// ==================== Products Payment Milestones Routes ====================
router.get('/products/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Payment milestones GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from products_bd table
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for product_id:', id);

    const result = await pool.query(`
      SELECT ep.*, po.invoice_no, po.invoice_value
      FROM entity_payments ep
      LEFT JOIN purchase_orders_bd po ON ep.po_id = po.po_id
      WHERE ep.entity_id = $1
      ORDER BY ep.payment_date DESC
    `, [entityId]);
    
    console.log('Found payment milestones:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment milestones:', error);
    res.status(500).json({ error: 'Failed to fetch payment milestones' });
  }
});

router.post('/products/:id/payment-milestones', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Payment milestones POST route hit with id:', req.params.id, 'body:', req.body);
  try {
    const { id } = req.params;
    const { payment_date, amount, status, remarks, po_id, billing_start_date, billing_end_date } = req.body;

    if (!payment_date || !amount || !po_id || !billing_start_date || !billing_end_date) {
      res.status(400).json({ error: 'Missing required fields: payment_date, amount, po_id, billing_start_date, and billing_end_date are required' });
      return;
    }

    // First get the entity_id from products_bd table
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for product_id:', id);

    // Verify that the purchase order exists and belongs to this entity
    const poResult = await pool.query(
      'SELECT po_id FROM purchase_orders_bd WHERE po_id = $1 AND entity_id = $2',
      [po_id, entityId]
    );

    if (poResult.rows.length === 0) {
      res.status(400).json({ error: 'Purchase order not found or does not belong to this product' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO entity_payments (entity_id, po_id, payment_date, amount, status, remarks, billing_start_date, billing_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [entityId, po_id, payment_date, amount, status || 'pending', remarks || '', billing_start_date, billing_end_date]
    );

    // Auto-update PO status
    await autoUpdatePOStatus(po_id, (req as any).user.id);

    console.log('Created payment milestone:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payment milestone:', error);
    res.status(500).json({ error: 'Failed to create payment milestone' });
  }
});

router.put('/products/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    const { payment_date, amount, status, remarks, billing_start_date, billing_end_date } = req.body;

    // First get the entity_id from products_bd table
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;

    const result = await pool.query(
      `UPDATE entity_payments 
       SET payment_date = $1, amount = $2, status = $3, remarks = $4, billing_start_date = $5, billing_end_date = $6
       WHERE id = $7 AND entity_id = $8
       RETURNING *`,
      [payment_date, amount, status, remarks, billing_start_date, billing_end_date, paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payment milestone:', error);
    res.status(500).json({ error: 'Failed to update payment milestone' });
  }
});

router.delete('/products/:id/payment-milestones/:paymentId', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentId } = req.params;
    
    // First get the entity_id from products_bd table
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;
    
    const result = await pool.query(
      'DELETE FROM entity_payments WHERE id = $1 AND entity_id = $2 RETURNING *',
      [paymentId, entityId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Payment milestone not found' });
      return;
    }

    // Auto-update PO status
    const poId = result.rows[0].po_id;
    await autoUpdatePOStatus(poId, (req as any).user.id);

    res.json({ message: 'Payment milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment milestone:', error);
    res.status(500).json({ error: 'Failed to delete payment milestone' });
  }
});

// ==================== Products Purchase Orders Routes ====================
router.get('/products/:id/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  console.log('Purchase orders GET route hit with id:', req.params.id);
  try {
    const { id } = req.params;
    
    // First get the entity_id from products_bd table
    const productResult = await pool.query(
      'SELECT entity_id FROM products_bd WHERE id = $1',
      [id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const entityId = productResult.rows[0].entity_id;
    console.log('Found entity_id:', entityId, 'for product_id:', id);

    const result = await pool.query(`
      SELECT po.*, e.employee_name as requested_by_name
      FROM purchase_orders_bd po
      LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
      WHERE po.entity_id = $1 
      ORDER BY po.invoice_date
    `, [entityId]);
    
    console.log('Found purchase orders:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// ==================== Purchase Orders Routes ====================
router.get('/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        po.po_id,
        po.entity_id,
        po.invoice_no,
        po.invoice_date,
        po.invoice_value,
        po.payment_duration,
        po.invoice_status,
        po.status,
        po.requested_by,
        po.payment_mode,
        po.remarks,
        be.name as entity_name,
        be.entity_type,
        be.order_value,
        c.client_name,
        e.employee_name as requested_by_name
      FROM purchase_orders_bd po
      JOIN business_entities be ON po.entity_id = be.id
      LEFT JOIN clients c ON be.client_id = c.id
      LEFT JOIN hr_employees e ON po.requested_by = e.employee_id
      ORDER BY po.invoice_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

router.post('/purchase-orders', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode, remarks } = req.body;

    if (!entity_id || !invoice_no || !invoice_date || !invoice_value || !invoice_status || !requested_by) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO purchase_orders_bd (entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING po_id`,
      [entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode || '', remarks || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

router.put('/purchase-orders/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode, remarks } = req.body;

    // Validate required fields
    if (!invoice_no || !invoice_date || !invoice_value || !invoice_status) {
      res.status(400).json({ error: 'Missing required fields: invoice_no, invoice_date, invoice_value, and invoice_status are required' });
      return;
    }

    const result = await pool.query(
      `UPDATE purchase_orders_bd 
       SET entity_id = $1, invoice_no = $2, invoice_date = $3, invoice_value = $4, payment_duration = $5, invoice_status = $6, requested_by = $7, payment_mode = $8, remarks = $9
       WHERE po_id = $10
       RETURNING po_id`,
      [entity_id, invoice_no, invoice_date, invoice_value, payment_duration, invoice_status, requested_by, payment_mode, remarks, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

router.delete('/purchase-orders/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM purchase_orders_bd WHERE po_id = $1 RETURNING po_id', [id]);

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

// ==================== PO Status Management Routes ====================
router.get('/purchase-orders/:poId/status-history', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { poId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        psh.id,
        psh.old_status,
        psh.new_status,
        psh.changed_at,
        psh.reason,
        u.username as changed_by
      FROM po_status_history psh
      LEFT JOIN users u ON psh.changed_by = u.id
      WHERE psh.po_id = $1
      ORDER BY psh.changed_at DESC
    `, [poId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching PO status history:', error);
    res.status(500).json({ error: 'Failed to fetch status history' });
  }
});

router.put('/purchase-orders/:poId/status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { poId } = req.params;
  const { new_status, reason } = req.body;
  const userId = (req as any).user.id;

  try {
    // Get current status
    const currentStatusResult = await pool.query(
      'SELECT status FROM purchase_orders_bd WHERE po_id = $1',
      [poId]
    );

    if (currentStatusResult.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    const oldStatus = currentStatusResult.rows[0].status;

    // Update PO status
    await pool.query(
      'UPDATE purchase_orders_bd SET status = $1 WHERE po_id = $2',
      [new_status, poId]
    );

    // Record status change in history
    await pool.query(`
      INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [poId, oldStatus, new_status, userId, reason]);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating PO status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/purchase-orders/:poId/auto-update-status', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  const { poId } = req.params;

  try {
    // Get PO details
    const poResult = await pool.query(
      'SELECT * FROM purchase_orders_bd WHERE po_id = $1',
      [poId]
    );

    if (poResult.rows.length === 0) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    const po = poResult.rows[0];

    // Get total payments received
    const paymentsResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_received
      FROM entity_payments 
      WHERE po_id = $1 AND status = 'received'
    `, [poId]);

    const totalReceived = parseFloat(paymentsResult.rows[0].total_received);
    const invoiceValue = parseFloat(po.invoice_value);

    // Determine new status
    let newStatus = po.status;
    if (totalReceived === 0) {
      newStatus = 'Payment Pending';
    } else if (totalReceived < invoiceValue) {
      newStatus = 'Partial Payment';
    } else if (totalReceived >= invoiceValue) {
      newStatus = 'Paid Completely';
    }

    // Update status if changed
    if (newStatus !== po.status) {
      await pool.query(
        'UPDATE purchase_orders_bd SET status = $1 WHERE po_id = $2',
        [newStatus, poId]
      );

      // Record status change
      await pool.query(`
        INSERT INTO po_status_history (po_id, old_status, new_status, changed_by, reason)
        VALUES ($1, $2, $3, $4, $5)
      `, [poId, po.status, newStatus, (req as any).user.id, 'Auto-updated based on payment milestones']);

      res.json({ 
        message: 'Status auto-updated successfully',
        old_status: po.status,
        new_status: newStatus
      });
    } else {
      res.json({ 
        message: 'Status unchanged',
        current_status: po.status
      });
    }
  } catch (error) {
    console.error('Error auto-updating PO status:', error);
    res.status(500).json({ error: 'Failed to auto-update status' });
  }
});

export default router; 