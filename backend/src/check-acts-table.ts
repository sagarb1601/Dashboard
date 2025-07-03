import pool from './db';

async function checkActsTable() {
  try {
    console.log('Checking acts_course table...');
    
    // Check total count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM acts_course');
    console.log('Total courses:', countResult.rows[0].count);
    
    // Check all records
    const allResult = await pool.query('SELECT * FROM acts_course ORDER BY id');
    console.log('All courses:');
    allResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Course: ${row.course_name}, Batch: ${row.batch_id}, Year: ${row.year}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkActsTable(); 