import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function createMMGUser() {
  try {
    console.log('Creating MMG user...');
    
    // Hash the password
    const password = 'mmg123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Check if MMG user already exists
    const existingUser = await pool.query(
      'SELECT username, role FROM users WHERE username = $1',
      ['mmg']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('MMG user already exists. Updating role...');
      await pool.query(
        'UPDATE users SET password_hash = $1, role = $2 WHERE username = $3',
        [hashedPassword, 'mmg', 'mmg']
      );
    } else {
      console.log('Creating new MMG user...');
      await pool.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['mmg', hashedPassword, 'mmg']
      );
    }
    
    // Verify the user was created/updated
    const verifyUser = await pool.query(
      'SELECT username, role FROM users WHERE username = $1',
      ['mmg']
    );
    
    console.log('MMG user created/updated successfully:', verifyUser.rows[0]);
    console.log('Login credentials:');
    console.log('Username: mmg');
    console.log('Password: mmg123');
    
  } catch (error) {
    console.error('Error creating MMG user:', error);
  } finally {
    await pool.end();
  }
}

createMMGUser(); 