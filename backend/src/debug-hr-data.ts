import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool();

async function debugHRData() {
  try {
    console.log('=== DEBUGGING HR DATA ===\n');

    // 1. Check all employees
    console.log('1. All employees in database:');
    const allEmployees = await pool.query(`
      SELECT employee_id, employee_name, status, is_deleted, join_date, technical_group_id 
      FROM hr_employees 
      ORDER BY employee_id
    `);
    console.log('Total employees found:', allEmployees.rows.length);
    allEmployees.rows.forEach(emp => {
      console.log(`  ID: ${emp.employee_id}, Name: ${emp.employee_name}, Status: ${emp.status}, is_deleted: ${emp.is_deleted}, Join: ${emp.join_date}, Group: ${emp.technical_group_id}`);
    });

    // 2. Test the summary query
    console.log('\n2. Testing summary query:');
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN EXTRACT(YEAR FROM join_date) = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 END) as new_hires_this_year,
        ROUND(
          CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(CASE WHEN status != 'active' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100 
            ELSE 0 
          END, 2
        ) as attrition_rate
      FROM hr_employees
      WHERE is_deleted = 'f' OR is_deleted IS NULL
    `);
    console.log('Summary query result:', summaryResult.rows[0]);

    // 3. Test department distribution query
    console.log('\n3. Testing department distribution query:');
    const deptResult = await pool.query(`
      SELECT 
        COALESCE(tg.group_name, 'Not Assigned') as department,
        COUNT(*) as employee_count
      FROM hr_employees he
      LEFT JOIN technical_groups tg ON he.technical_group_id = tg.group_id
      WHERE he.status = 'active' AND (he.is_deleted = 'f' OR he.is_deleted IS NULL)
      GROUP BY tg.group_name
      ORDER BY employee_count DESC
    `);
    console.log('Department distribution result:', deptResult.rows);

    // 4. Check technical groups
    console.log('\n4. Available technical groups:');
    const groups = await pool.query('SELECT group_id, group_name FROM technical_groups ORDER BY group_id');
    groups.rows.forEach(group => {
      console.log(`  ID: ${group.group_id}, Name: ${group.group_name}`);
    });

    // 5. Test with simpler query
    console.log('\n5. Simple active employees query:');
    const simpleResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM hr_employees 
      WHERE status = 'active'
    `);
    console.log('Active employees (no is_deleted filter):', simpleResult.rows[0].count);

    const simpleResult2 = await pool.query(`
      SELECT COUNT(*) as count 
      FROM hr_employees 
      WHERE status = 'active' AND (is_deleted = 'f' OR is_deleted IS NULL)
    `);
    console.log('Active employees (with is_deleted filter):', simpleResult2.rows[0].count);

  } catch (error) {
    console.error('Error debugging HR data:', error);
  } finally {
    await pool.end();
  }
}

debugHRData(); 