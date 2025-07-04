import pool from './db';

async function addSampleFinanceData() {
  try {
    console.log('Adding sample finance data...');

    // First, check if we have any finance projects
    const projectsResult = await pool.query(`
      SELECT project_id, project_name, total_value 
      FROM finance_projects 
      LIMIT 5
    `);

    if (projectsResult.rows.length === 0) {
      console.log('No finance projects found. Please add projects first.');
      return;
    }

    console.log('Found projects:', projectsResult.rows);

    // Check if we have budget fields
    const budgetFieldsResult = await pool.query(`
      SELECT field_id, field_name 
      FROM budget_fields 
      LIMIT 5
    `);

    if (budgetFieldsResult.rows.length === 0) {
      console.log('No budget fields found. Please add budget fields first.');
      return;
    }

    console.log('Found budget fields:', budgetFieldsResult.rows);

    const currentYear = new Date().getFullYear();

    // Add sample budget entries for current year
    for (const project of projectsResult.rows) {
      for (const field of budgetFieldsResult.rows) {
        const amount = Math.floor(Math.random() * 500000) + 100000; // Random amount between 100k and 600k
        
        await pool.query(`
          INSERT INTO project_budget_entries (project_id, field_id, year_number, amount)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (project_id, field_id, year_number) DO UPDATE SET
          amount = EXCLUDED.amount
        `, [project.project_id, field.field_id, currentYear, amount]);
      }
    }

    // Check table structure for expenditure entries
    const tableStructureCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_expenditure_entries' 
      AND column_name IN ('calendar_year', 'year_number')
    `);

    // Add sample expenditure entries
    for (const project of projectsResult.rows) {
      for (const field of budgetFieldsResult.rows) {
        const amountSpent = Math.floor(Math.random() * 200000) + 50000; // Random amount between 50k and 250k
        
        if (tableStructureCheck.rows.some(row => row.column_name === 'calendar_year')) {
          // New structure with calendar_year
          await pool.query(`
            INSERT INTO project_expenditure_entries (
              project_id, field_id, calendar_year, quarter, amount_spent, expenditure_date, remarks
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (project_id, field_id, calendar_year, quarter) DO UPDATE SET
            amount_spent = EXCLUDED.amount_spent
          `, [
            project.project_id, 
            field.field_id, 
            currentYear, 
            Math.floor(Math.random() * 4) + 1, // Random quarter 1-4
            amountSpent,
            new Date().toISOString().split('T')[0],
            'Sample expenditure entry'
          ]);
        } else {
          // Old structure with year_number
          await pool.query(`
            INSERT INTO project_expenditure_entries (
              project_id, field_id, year_number, period_type, period_number, amount_spent, expenditure_date, remarks
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (project_id, field_id, year_number, period_type, period_number) DO UPDATE SET
            amount_spent = EXCLUDED.amount_spent
          `, [
            project.project_id, 
            field.field_id, 
            currentYear, 
            'Quarter',
            Math.floor(Math.random() * 4) + 1, // Random quarter 1-4
            amountSpent,
            new Date().toISOString().split('T')[0],
            'Sample expenditure entry'
          ]);
        }
      }
    }

    console.log('Sample finance data added successfully!');
    console.log('Current year:', currentYear);
    console.log('Added budget entries and expenditure entries for', projectsResult.rows.length, 'projects');

  } catch (error) {
    console.error('Error adding sample finance data:', error);
  } finally {
    await pool.end();
  }
}

addSampleFinanceData(); 