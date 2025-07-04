import { pool } from './db/db';

async function checkCalendarTimezone() {
  try {
    console.log('Checking calendar events timezone data...');
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        start_time,
        end_time,
        start_time AT TIME ZONE 'UTC' as start_time_utc,
        end_time AT TIME ZONE 'UTC' as end_time_utc,
        start_time AT TIME ZONE 'Asia/Kolkata' as start_time_ist,
        end_time AT TIME ZONE 'Asia/Kolkata' as end_time_ist
      FROM calendar_events 
      ORDER BY start_time DESC 
      LIMIT 5
    `);
    
    console.log('Recent calendar events:');
    result.rows.forEach((row: any, index: number) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Title: ${row.title}`);
      console.log(`  Start Time (stored): ${row.start_time}`);
      console.log(`  End Time (stored): ${row.end_time}`);
      console.log(`  Start Time (UTC): ${row.start_time_utc}`);
      console.log(`  End Time (UTC): ${row.end_time_utc}`);
      console.log(`  Start Time (IST): ${row.start_time_ist}`);
      console.log(`  End Time (IST): ${row.end_time_ist}`);
    });
    
    // Check column types
    const columnResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'calendar_events' 
      AND column_name IN ('start_time', 'end_time', 'created_at', 'updated_at')
      ORDER BY column_name
    `);
    
    console.log('\nColumn types:');
    columnResult.rows.forEach((row: any) => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('Error checking calendar timezone:', error);
  } finally {
    await pool.end();
  }
}

checkCalendarTimezone(); 