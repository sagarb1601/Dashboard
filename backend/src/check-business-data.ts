import pool from './db';

async function checkBusinessData() {
  try {
    console.log('Checking Business Division data...');

    // Check clients
    const clientsCount = await pool.query(`
      SELECT COUNT(*) as total_clients FROM clients;
    `);
    console.log('Total clients:', clientsCount.rows[0].total_clients);

    // Check business entities
    const entitiesCount = await pool.query(`
      SELECT COUNT(*) as total_entities FROM business_entities;
    `);
    console.log('Total business entities:', entitiesCount.rows[0].total_entities);

    // Check business entities by type
    const entitiesByType = await pool.query(`
      SELECT entity_type, COUNT(*) as count
      FROM business_entities
      GROUP BY entity_type
      ORDER BY count DESC;
    `);
    console.log('Business entities by type:', entitiesByType.rows);

    // Check projects
    const projectsCount = await pool.query(`
      SELECT COUNT(*) as total_projects FROM projects_bd;
    `);
    console.log('Total projects:', projectsCount.rows[0].total_projects);

    // Check products
    const productsCount = await pool.query(`
      SELECT COUNT(*) as total_products FROM products_bd;
    `);
    console.log('Total products:', productsCount.rows[0].total_products);

    // Check services
    const servicesCount = await pool.query(`
      SELECT COUNT(*) as total_services FROM services_bd;
    `);
    console.log('Total services:', servicesCount.rows[0].total_services);

    // Check purchase orders
    const poCount = await pool.query(`
      SELECT COUNT(*) as total_pos FROM purchase_orders_bd;
    `);
    console.log('Total purchase orders:', poCount.rows[0].total_pos);

    // Check purchase orders by status
    const poByStatus = await pool.query(`
      SELECT invoice_status, COUNT(*) as count
      FROM purchase_orders_bd
      GROUP BY invoice_status
      ORDER BY count DESC;
    `);
    console.log('Purchase orders by status:', poByStatus.rows);

    // Check total order value
    const totalOrderValue = await pool.query(`
      SELECT COALESCE(SUM(order_value), 0) as total_value
      FROM business_entities;
    `);
    console.log('Total order value:', totalOrderValue.rows[0].total_value);

    // Check total invoice value
    const totalInvoiceValue = await pool.query(`
      SELECT COALESCE(SUM(invoice_value), 0) as total_invoice_value
      FROM purchase_orders_bd;
    `);
    console.log('Total invoice value:', totalInvoiceValue.rows[0].total_invoice_value);

    // Check payments
    const paymentsCount = await pool.query(`
      SELECT COUNT(*) as total_payments FROM entity_payments;
    `);
    console.log('Total payments:', paymentsCount.rows[0].total_payments);

    // Check payments by status
    const paymentsByStatus = await pool.query(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
      FROM entity_payments
      GROUP BY status
      ORDER BY count DESC;
    `);
    console.log('Payments by status:', paymentsByStatus.rows);

    // Check monthly trends for business entities
    const monthlyEntities = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as entity_count
      FROM business_entities
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    console.log('Monthly business entities:', monthlyEntities.rows);

    // Check monthly trends for purchase orders
    const monthlyPOs = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as po_count,
        COALESCE(SUM(invoice_value), 0) as total_invoice_value
      FROM purchase_orders_bd
      WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);
    console.log('Monthly purchase orders:', monthlyPOs.rows);

    // Check entity_payments table schema
    const paymentsSchema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'entity_payments' 
      ORDER BY ordinal_position
    `);
    console.log('entity_payments table schema:');
    console.log(paymentsSchema.rows);
    const paymentsData = await pool.query('SELECT * FROM entity_payments LIMIT 3');
    console.log('\nSample entity_payments data:');
    console.log(paymentsData.rows);

  } catch (error) {
    console.error('Error checking business data:', error);
  } finally {
    await pool.end();
  }
}

checkBusinessData(); 