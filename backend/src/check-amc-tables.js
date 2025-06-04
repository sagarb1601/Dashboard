const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool();

async function checkAMCTables() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'amc_providers'
      );
    `);
    
    console.log('AMC providers table exists:', result.rows[0].exists);
    
    if (!result.rows[0].exists) {
      console.log('Running AMC tables migration...');
      const migrationSQL = `
        -- Create admin_equipments table with default values
        CREATE TABLE IF NOT EXISTS admin_equipments (
            equipment_id SERIAL PRIMARY KEY,
            equipment_name VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert default equipment types
        INSERT INTO admin_equipments (equipment_name) VALUES
            ('AC'),
            ('Printer'),
            ('Water Purifier'),
            ('Diesel Set'),
            ('UPS'),
            ('CCTV'),
            ('Fire Alarm System'),
            ('Elevator'),
            ('Generator');

        -- Create amc_providers table
        CREATE TABLE IF NOT EXISTS amc_providers (
            amcprovider_id SERIAL PRIMARY KEY,
            amcprovider_name VARCHAR(100) NOT NULL,
            contact_person_name VARCHAR(100) NOT NULL,
            contact_number VARCHAR(20) NOT NULL,
            email VARCHAR(100) NOT NULL,
            address TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create amc_contracts table
        CREATE TABLE IF NOT EXISTS amc_contracts (
            amccontract_id SERIAL PRIMARY KEY,
            equipment_id INTEGER REFERENCES admin_equipments(equipment_id),
            amcprovider_id INTEGER REFERENCES amc_providers(amcprovider_id),
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            amc_value DECIMAL(12,2) NOT NULL,
            remarks TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT valid_date_range CHECK (end_date >= start_date),
            CONSTRAINT positive_amc_value CHECK (amc_value > 0)
        );
      `;
      
      await pool.query(migrationSQL);
      console.log('AMC tables created successfully');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAMCTables(); 