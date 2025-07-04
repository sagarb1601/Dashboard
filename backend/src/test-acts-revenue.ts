import pool from './db';

async function testACTSRevenue() {
  try {
    console.log('=== TESTING ACTS REVENUE DATA ===\n');

    // Check if acts_course table has data
    const countResult = await pool.query('SELECT COUNT(*) FROM acts_course');
    console.log('Total courses in acts_course:', countResult.rows[0].count);

    // Check sample data
    const sampleResult = await pool.query(`
      SELECT 
        course_name,
        year,
        students_enrolled,
        course_fee,
        (students_enrolled * course_fee) as revenue
      FROM acts_course 
      LIMIT 5
    `);
    
    console.log('\nSample ACTS course data:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.course_name} (${row.year})`);
      console.log(`   Enrolled: ${row.students_enrolled}, Fee: ₹${row.course_fee}, Revenue: ₹${row.revenue}`);
    });

    // Test the revenue query
    const revenueResult = await pool.query(`
      SELECT 
        course_name,
        year,
        (students_enrolled * course_fee) as total_revenue
      FROM acts_course
      ORDER BY year DESC, total_revenue DESC
    `);

    console.log('\nRevenue query result:');
    revenueResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.course_name} (${row.year}): ₹${row.total_revenue}`);
    });

  } catch (error) {
    console.error('Error testing ACTS revenue:', error);
  } finally {
    await pool.end();
  }
}

testACTSRevenue(); 