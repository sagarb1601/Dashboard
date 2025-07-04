import { pool } from './src/db/db';

async function testRevenueData() {
  try {
    console.log('Testing ACTS Revenue Data...\n');

    // Test revenue by course query
    const revenueQuery = `
      SELECT 
        c.course_name,
        COALESCE(SUM(c.course_fee), 0) as total_revenue
      FROM courses c
      LEFT JOIN students s ON c.course_id = s.course_id
      GROUP BY c.course_id, c.course_name
      ORDER BY total_revenue DESC
    `;

    const revenueResult = await pool.query(revenueQuery);
    console.log('Revenue by Course:');
    console.log(JSON.stringify(revenueResult.rows, null, 2));
    console.log('\n');

    // Check if we have any courses with fees
    const courseFeesQuery = `
      SELECT course_name, course_fee 
      FROM courses 
      WHERE course_fee IS NOT NULL AND course_fee > 0
      ORDER BY course_fee DESC
    `;

    const courseFeesResult = await pool.query(courseFeesQuery);
    console.log('Courses with fees:');
    console.log(JSON.stringify(courseFeesResult.rows, null, 2));

  } catch (error) {
    console.error('Error testing revenue data:', error);
  } finally {
    await pool.end();
  }
}

testRevenueData(); 