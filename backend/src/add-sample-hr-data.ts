import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function addSampleHRData() {
  try {
    console.log('Adding sample HR data...');

    // First, let's check if we have the required tables and data
    const designationsResult = await pool.query('SELECT designation_id FROM hr_designations LIMIT 1');
    const groupsResult = await pool.query('SELECT group_id FROM technical_groups LIMIT 1');

    if (designationsResult.rows.length === 0) {
      console.log('No designations found, inserting initial designations...');
      await pool.query(`
        INSERT INTO hr_designations (designation, designation_full, level) VALUES
        ('PE', 'Project Engineer', 1),
        ('KA', 'Knowledge Associate', 1),
        ('SPE', 'Senior Project Engineer', 2),
        ('PA', 'Project Associate', 1)
        ON CONFLICT DO NOTHING;
      `);
    }

    if (groupsResult.rows.length === 0) {
      console.log('No technical groups found, inserting initial groups...');
      await pool.query(`
        INSERT INTO technical_groups (group_name, group_description) VALUES
        ('SOULWARE', 'Software Development Group'),
        ('VLSI', 'VLSI Design Group'),
        ('HPC', 'High Performance Computing Group'),
        ('SSP', 'System Software and Platform Group'),
        ('AI', 'Artificial Intelligence Group'),
        ('IoT', 'Internet of Things Group')
        ON CONFLICT DO NOTHING;
      `);
    }

    // Get the IDs for reference
    const designations = await pool.query('SELECT designation_id FROM hr_designations ORDER BY designation_id');
    const groups = await pool.query('SELECT group_id FROM technical_groups ORDER BY group_id');

    if (designations.rows.length === 0 || groups.rows.length === 0) {
      console.log('Failed to get designations or groups');
      return;
    }

    // Add sample employees with shorter gender and centre values
    await pool.query(`
      INSERT INTO hr_employees (employee_id, employee_name, join_date, designation_id, technical_group_id, status, gender, level, centre) VALUES
      (1001, 'Rajesh Kumar', '2023-01-15', ${designations.rows[0].designation_id}, ${groups.rows[0].group_id}, 'active', 'M', 1, 'KP'),
      (1002, 'Priya Sharma', '2023-02-20', ${designations.rows[1].designation_id}, ${groups.rows[1].group_id}, 'active', 'F', 1, 'EC'),
      (1003, 'Amit Patel', '2023-03-10', ${designations.rows[2].designation_id}, ${groups.rows[2].group_id}, 'active', 'M', 2, 'EC'),
      (1004, 'Neha Singh', '2023-04-05', ${designations.rows[0].designation_id}, ${groups.rows[3].group_id}, 'active', 'F', 1, 'KP'),
      (1005, 'Vikram Mehta', '2023-05-12', ${designations.rows[1].designation_id}, ${groups.rows[4].group_id}, 'active', 'M', 1, 'EC'),
      (1006, 'Anjali Verma', '2023-06-18', ${designations.rows[3].designation_id}, ${groups.rows[5].group_id}, 'active', 'F', 1, 'EC'),
      (1007, 'Ramesh Kumar', '2023-07-22', ${designations.rows[0].designation_id}, ${groups.rows[0].group_id}, 'inactive', 'M', 1, 'KP'),
      (1008, 'Sita Devi', '2023-08-30', ${designations.rows[1].designation_id}, ${groups.rows[1].group_id}, 'active', 'F', 1, 'EC'),
      (1009, 'Arun Singh', '2024-01-15', ${designations.rows[2].designation_id}, ${groups.rows[2].group_id}, 'active', 'M', 2, 'EC'),
      (1010, 'Meera Patel', '2024-02-20', ${designations.rows[0].designation_id}, ${groups.rows[3].group_id}, 'active', 'F', 1, 'KP'),
      (1011, 'Kiran Sharma', '2024-03-10', ${designations.rows[1].designation_id}, ${groups.rows[4].group_id}, 'active', 'M', 1, 'EC'),
      (1012, 'Ravi Kumar', '2024-04-05', ${designations.rows[3].designation_id}, ${groups.rows[5].group_id}, 'active', 'M', 1, 'EC'),
      (1013, 'Sunita Yadav', '2024-05-12', ${designations.rows[0].designation_id}, ${groups.rows[0].group_id}, 'active', 'F', 1, 'KP'),
      (1014, 'Deepak Gupta', '2024-06-18', ${designations.rows[1].designation_id}, ${groups.rows[1].group_id}, 'active', 'M', 1, 'EC'),
      (1015, 'Pooja Singh', '2024-07-22', ${designations.rows[2].designation_id}, ${groups.rows[2].group_id}, 'active', 'F', 2, 'EC')
      ON CONFLICT (employee_id) DO NOTHING;
    `);

    console.log('Sample HR data added successfully!');
  } catch (error) {
    console.error('Error adding sample HR data:', error);
  } finally {
    await pool.end();
  }
}

addSampleHRData(); 