import pool from './db';

async function addSampleBusinessData() {
  try {
    console.log('Adding sample business data...');

    // Add sample clients
    const clientsResult = await pool.query(`
      INSERT INTO clients (client_name, contact_person, email, contact_number, address, description, created_at)
      VALUES 
        ('TechCorp Solutions', 'John Smith', 'john@techcorp.com', '9876543210', 'Mumbai, Maharashtra', 'Technology solutions provider', NOW()),
        ('Digital Innovations Ltd', 'Sarah Johnson', 'sarah@digitalinnovations.com', '9876543211', 'Bangalore, Karnataka', 'Digital transformation company', NOW()),
        ('Smart Systems Pvt Ltd', 'Mike Wilson', 'mike@smartsystems.com', '9876543212', 'Delhi, NCR', 'Smart city solutions', NOW()),
        ('Future Technologies', 'Lisa Brown', 'lisa@futuretech.com', '9876543213', 'Pune, Maharashtra', 'Future-ready technology solutions', NOW()),
        ('Innovation Hub', 'David Lee', 'david@innovationhub.com', '9876543214', 'Hyderabad, Telangana', 'Innovation and research hub', NOW())
      ON CONFLICT (client_name) DO NOTHING
      RETURNING id
    `);

    console.log('Added sample clients');

    // Get client IDs
    const clientIds = await pool.query('SELECT id FROM clients LIMIT 5');
    const clientId1 = clientIds.rows[0]?.id;
    const clientId2 = clientIds.rows[1]?.id;
    const clientId3 = clientIds.rows[2]?.id;
    const clientId4 = clientIds.rows[3]?.id;
    const clientId5 = clientIds.rows[4]?.id;

    if (!clientId1 || !clientId2 || !clientId3 || !clientId4 || !clientId5) {
      console.log('Client IDs not found, skipping business entities');
      return;
    }

    // Add sample business entities
    await pool.query(`
      INSERT INTO business_entities (name, entity_type, client_id, start_date, end_date, order_value, payment_duration, description, created_at, updated_at, service_type)
      VALUES 
        ('E-Commerce Platform', 'product', ${clientId1}, NOW() - INTERVAL '11 months', NOW() + INTERVAL '1 month', 2500000, 'Yearly', 'Custom e-commerce solution', NOW() - INTERVAL '11 months', NOW() - INTERVAL '11 months', NULL),
        ('Digital Transformation', 'service', ${clientId1}, NOW() - INTERVAL '10 months', NOW() + INTERVAL '2 months', 1500000, 'Quarterly', 'Digital transformation consulting', NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months', NULL),
        ('AI/ML Training Program', 'service', ${clientId2}, NOW() - INTERVAL '9 months', NOW() + INTERVAL '3 months', 800000, 'Monthly', 'AI and ML training for employees', NOW() - INTERVAL '9 months', NOW() - INTERVAL '9 months', 'Training'),
        ('Mobile App Development', 'product', ${clientId2}, NOW() - INTERVAL '8 months', NOW() + INTERVAL '4 months', 1200000, 'Yearly', 'Cross-platform mobile application', NOW() - INTERVAL '8 months', NOW() - INTERVAL '8 months', NULL),
        ('Cloud Migration', 'service', ${clientId3}, NOW() - INTERVAL '7 months', NOW() + INTERVAL '5 months', 2000000, 'One-time', 'AWS cloud migration services', NOW() - INTERVAL '7 months', NOW() - INTERVAL '7 months', NULL),
        ('Cybersecurity Training', 'service', ${clientId3}, NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', 600000, 'Monthly', 'Security awareness training', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months', 'Training'),
        ('ERP System', 'project', ${clientId4}, NOW() - INTERVAL '5 months', NOW() + INTERVAL '7 months', 3500000, 'Yearly', 'Enterprise resource planning system', NOW() - INTERVAL '5 months', NOW() - INTERVAL '5 months', NULL),
        ('Process Optimization', 'service', ${clientId4}, NOW() - INTERVAL '4 months', NOW() + INTERVAL '8 months', 900000, 'Quarterly', 'Business process optimization', NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months', NULL),
        ('Data Science Workshop', 'service', ${clientId5}, NOW() - INTERVAL '3 months', NOW() + INTERVAL '9 months', 500000, 'Monthly', 'Data science and analytics training', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months', 'Training'),
        ('Web Application', 'product', ${clientId5}, NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', 1800000, 'Yearly', 'Custom web application development', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months', NULL)
      ON CONFLICT DO NOTHING
    `);

    console.log('Added sample business entities');

    // Get business entity IDs
    const entityIds = await pool.query('SELECT id FROM business_entities LIMIT 10');
    const entityId1 = entityIds.rows[0]?.id;
    const entityId2 = entityIds.rows[1]?.id;
    const entityId3 = entityIds.rows[2]?.id;
    const entityId4 = entityIds.rows[3]?.id;
    const entityId5 = entityIds.rows[4]?.id;
    const entityId6 = entityIds.rows[5]?.id;
    const entityId7 = entityIds.rows[6]?.id;
    const entityId8 = entityIds.rows[7]?.id;
    const entityId9 = entityIds.rows[8]?.id;
    const entityId10 = entityIds.rows[9]?.id;

    if (!entityId1 || !entityId2 || !entityId3 || !entityId4 || !entityId5 || 
        !entityId6 || !entityId7 || !entityId8 || !entityId9 || !entityId10) {
      console.log('Entity IDs not found, skipping purchase orders');
      return;
    }

    // Add sample purchase orders
    await pool.query(`
      INSERT INTO purchase_orders_bd (entity_id, invoice_no, invoice_date, invoice_value, invoice_status, created_at)
      VALUES 
        (${entityId1}, 'INV-2024-001', NOW() - INTERVAL '11 months', 2500000, 'Paid', NOW() - INTERVAL '11 months'),
        (${entityId2}, 'INV-2024-002', NOW() - INTERVAL '10 months', 1500000, 'Paid', NOW() - INTERVAL '10 months'),
        (${entityId3}, 'INV-2024-003', NOW() - INTERVAL '9 months', 800000, 'Pending', NOW() - INTERVAL '9 months'),
        (${entityId4}, 'INV-2024-004', NOW() - INTERVAL '8 months', 1200000, 'Paid', NOW() - INTERVAL '8 months'),
        (${entityId5}, 'INV-2024-005', NOW() - INTERVAL '7 months', 2000000, 'Approved', NOW() - INTERVAL '7 months'),
        (${entityId6}, 'INV-2024-006', NOW() - INTERVAL '6 months', 600000, 'Paid', NOW() - INTERVAL '6 months'),
        (${entityId7}, 'INV-2024-007', NOW() - INTERVAL '5 months', 3500000, 'Pending', NOW() - INTERVAL '5 months'),
        (${entityId8}, 'INV-2024-008', NOW() - INTERVAL '4 months', 900000, 'Approved', NOW() - INTERVAL '4 months'),
        (${entityId9}, 'INV-2024-009', NOW() - INTERVAL '3 months', 500000, 'Paid', NOW() - INTERVAL '3 months'),
        (${entityId10}, 'INV-2024-010', NOW() - INTERVAL '2 months', 1800000, 'Pending', NOW() - INTERVAL '2 months')
      ON CONFLICT DO NOTHING
    `);

    console.log('Added sample purchase orders');

    // Get purchase order IDs
    const poIds = await pool.query('SELECT po_id, entity_id FROM purchase_orders_bd LIMIT 10');
    const po1 = poIds.rows[0];
    const po2 = poIds.rows[1];
    const po3 = poIds.rows[2];
    const po4 = poIds.rows[3];
    const po5 = poIds.rows[4];
    const po6 = poIds.rows[5];
    const po7 = poIds.rows[6];
    const po8 = poIds.rows[7];
    const po9 = poIds.rows[8];
    const po10 = poIds.rows[9];

    if (!po1 || !po2 || !po3 || !po4 || !po5 || !po6 || !po7 || !po8 || !po9 || !po10) {
      console.log('PO IDs not found, skipping payments');
      return;
    }

    // Add sample payments
    await pool.query(`
      INSERT INTO entity_payments (po_id, entity_id, payment_date, amount, status, created_at)
      VALUES 
        (${po1.po_id}, ${po1.entity_id}, NOW() - INTERVAL '10 months', 2500000, 'received', NOW() - INTERVAL '10 months'),
        (${po2.po_id}, ${po2.entity_id}, NOW() - INTERVAL '9 months', 1500000, 'received', NOW() - INTERVAL '9 months'),
        (${po3.po_id}, ${po3.entity_id}, NOW() - INTERVAL '8 months', 800000, 'pending', NOW() - INTERVAL '8 months'),
        (${po4.po_id}, ${po4.entity_id}, NOW() - INTERVAL '7 months', 1200000, 'received', NOW() - INTERVAL '7 months'),
        (${po5.po_id}, ${po5.entity_id}, NOW() - INTERVAL '6 months', 2000000, 'pending', NOW() - INTERVAL '6 months'),
        (${po6.po_id}, ${po6.entity_id}, NOW() - INTERVAL '5 months', 600000, 'received', NOW() - INTERVAL '5 months'),
        (${po7.po_id}, ${po7.entity_id}, NOW() - INTERVAL '4 months', 3500000, 'pending', NOW() - INTERVAL '4 months'),
        (${po8.po_id}, ${po8.entity_id}, NOW() - INTERVAL '3 months', 900000, 'received', NOW() - INTERVAL '3 months'),
        (${po9.po_id}, ${po9.entity_id}, NOW() - INTERVAL '2 months', 500000, 'received', NOW() - INTERVAL '2 months'),
        (${po10.po_id}, ${po10.entity_id}, NOW() - INTERVAL '1 month', 1800000, 'pending', NOW() - INTERVAL '1 month')
      ON CONFLICT DO NOTHING
    `);

    console.log('Added sample payments');
    console.log('Sample business data added successfully!');

  } catch (error) {
    console.error('Error adding sample business data:', error);
  } finally {
    await pool.end();
  }
}

addSampleBusinessData(); 