import pool from './db';

async function clearActsData() {
  try {
    console.log('Clearing acts_course table...');
    
    // Check current count
    const countResult = await pool.query('SELECT COUNT(*) as count FROM acts_course');
    console.log('Current courses:', countResult.rows[0].count);
    
    if (parseInt(countResult.rows[0].count) > 0) {
      // Clear all data
      await pool.query('DELETE FROM acts_course');
      console.log('All ACTS course data cleared.');
      
      // Reset sequence
      await pool.query('ALTER SEQUENCE acts_course_id_seq RESTART WITH 1');
      console.log('ID sequence reset.');
    } else {
      console.log('Table is already empty.');
    }
    
    // Verify
    const verifyResult = await pool.query('SELECT COUNT(*) as count FROM acts_course');
    console.log('Courses after clearing:', verifyResult.rows[0].count);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

clearActsData(); 