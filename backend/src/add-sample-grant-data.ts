import pool from './db';

async function addSampleGrantData() {
  try {
    console.log('Adding sample grant received data...');

    // First, let's check if we have budget fields for the projects
    const budgetFieldsResult = await pool.query(`
      SELECT bf.field_id, bf.field_name, fp.project_id, fp.project_name
      FROM budget_fields bf
      JOIN finance_projects fp ON bf.project_id = fp.project_id
      LIMIT 10
    `);

    console.log('Found budget fields:', budgetFieldsResult.rows);

    if (budgetFieldsResult.rows.length === 0) {
      console.log('No budget fields found. Please add budget fields first.');
      return;
    }

    // Add sample grant received data
    const grantData = [
      { field_id: budgetFieldsResult.rows[0]?.field_id || 1, received_date: '2024-01-15', amount: 250000, remarks: 'First installment' },
      { field_id: budgetFieldsResult.rows[0]?.field_id || 1, received_date: '2024-03-15', amount: 300000, remarks: 'Second installment' },
      { field_id: budgetFieldsResult.rows[1]?.field_id || 2, received_date: '2024-02-01', amount: 400000, remarks: 'Initial grant' },
      { field_id: budgetFieldsResult.rows[1]?.field_id || 2, received_date: '2024-04-01', amount: 350000, remarks: 'Progress payment' },
      { field_id: budgetFieldsResult.rows[2]?.field_id || 3, received_date: '2024-01-20', amount: 200000, remarks: 'Startup grant' },
      { field_id: budgetFieldsResult.rows[2]?.field_id || 3, received_date: '2024-05-20', amount: 250000, remarks: 'Milestone payment' },
    ];

    for (const grant of grantData) {
      if (grant.field_id) {
        await pool.query(`
          INSERT INTO grant_received (field_id, received_date, amount, remarks)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (field_id, received_date) DO NOTHING
        `, [grant.field_id, grant.received_date, grant.amount, grant.remarks]);
      }
    }

    console.log('Sample grant received data added successfully!');
  } catch (error) {
    console.error('Error adding sample grant data:', error);
  } finally {
    await pool.end();
  }
}

addSampleGrantData(); 